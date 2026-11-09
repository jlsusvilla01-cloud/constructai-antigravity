"use server";

import { redirect } from "next/navigation";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { dbMessage, fail, num, ok, oneOf, optDate, optStr, refresh, str } from "@/lib/formdata";
import { getSession } from "@/lib/org";
import type { ActionState, PoStatus } from "@/lib/types";

// ─── Suppliers ───────────────────────────────────────────────────────────────

function readSupplier(fd: FormData) {
  return {
    name: str(fd, "name"),
    contact_person: optStr(fd, "contact_person"),
    phone: optStr(fd, "phone"),
    email: optStr(fd, "email"),
    tin: optStr(fd, "tin"),
    address: optStr(fd, "address"),
    notes: optStr(fd, "notes"),
  };
}

export async function addSupplier(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const values = readSupplier(fd);
  if (!values.name) return fail("Enter the supplier’s name.");
  const { error } = await supabase.from("suppliers").insert({ ...values, org_id: orgId });
  if (error) return fail(error.code === "23505" ? "You already have a supplier with that name." : "Couldn’t save. " + dbMessage(error));
  refresh();
  return ok();
}

export async function updateSupplier(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const values = readSupplier(fd);
  if (!values.name) return fail("Enter the supplier’s name.");
  const { error } = await supabase.from("suppliers").update(values).eq("id", id);
  if (error) return fail(error.code === "23505" ? "You already have a supplier with that name." : "Couldn’t save. " + dbMessage(error));
  refresh();
  redirect("/purchasing?view=suppliers");
}

export async function deleteSupplier(id: string): Promise<ActionState> {
  const { supabase, isOwner } = await getSession();
  if (!isOwner) return fail("Only an owner can delete suppliers.");
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) {
    return fail(error.code === "23503" ? "This supplier has purchase orders, so it can’t be deleted." : dbMessage(error));
  }
  refresh();
  return ok();
}

// ─── Purchase orders ─────────────────────────────────────────────────────────

type PoItemInput = { description: string; unit: string | null; quantity: number; unit_cost: number };

/** Item rows come in as parallel arrays: item_description[], item_unit[], item_qty[], item_cost[]. */
function readItems(fd: FormData): { error: string } | { items: PoItemInput[] } {
  const desc = fd.getAll("item_description").map((v) => String(v).trim());
  const unit = fd.getAll("item_unit").map((v) => String(v).trim());
  const qty = fd.getAll("item_qty").map((v) => String(v));
  const cost = fd.getAll("item_cost").map((v) => String(v));
  const items: PoItemInput[] = [];
  for (let i = 0; i < desc.length; i++) {
    const blank = !desc[i] && !(qty[i] ?? "").trim() && !(cost[i] ?? "").trim();
    if (blank) continue;
    const quantity = num(qty[i] ?? "", 3);
    const unitCost = num(cost[i] ?? "");
    if (!desc[i]) return { error: `Line ${i + 1}: describe the item.` };
    if (!(quantity > 0)) return { error: `Line ${i + 1}: enter a quantity.` };
    if (!(unitCost >= 0)) return { error: `Line ${i + 1}: enter the unit price.` };
    items.push({ description: desc[i], unit: unit[i] || null, quantity, unit_cost: unitCost });
  }
  if (items.length === 0) return { error: "Add at least one item." };
  return { items };
}

export async function createPurchaseOrder(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const projectId = str(fd, "project_id");
  let supplierId = str(fd, "supplier_id");
  const newSupplier = str(fd, "new_supplier");
  if (!projectId) return fail("Choose a project.");
  if (!supplierId && !newSupplier) return fail("Choose a supplier or type a new supplier’s name.");

  const parsed = readItems(fd);
  if ("error" in parsed) return fail(parsed.error);

  const expected = optDate(fd, "expected_date");
  const ordered = optDate(fd, "order_date");
  if (ordered && expected && expected < ordered) return fail("Expected delivery can’t be before the order date.");

  if (!supplierId) {
    // Reuse an existing supplier with the same name, otherwise add it.
    const { data: existing } = await supabase.from("suppliers").select("id").eq("org_id", orgId).ilike("name", newSupplier.replace(/[\\%_]/g, (c) => "\\" + c)).maybeSingle();
    if (existing) supplierId = existing.id;
    else {
      const { data, error } = await supabase.from("suppliers").insert({ org_id: orgId, name: newSupplier }).select("id").single();
      if (error) return fail("Couldn’t add the supplier. " + dbMessage(error));
      supplierId = data.id;
    }
  }

  const { data: id, error } = await supabase.rpc("create_purchase_order", {
    p_org: orgId,
    p_project: projectId,
    p_supplier: supplierId,
    p_category: oneOf(EXPENSE_CATEGORIES, str(fd, "category"), "materials"),
    p_boq_item: optStr(fd, "boq_item_id"),
    p_status: str(fd, "status") === "draft" ? "draft" : "ordered",
    p_order_date: ordered,
    p_expected_date: expected,
    p_notes: optStr(fd, "notes"),
    p_items: parsed.items,
  });
  if (error) return fail("Couldn’t save the PO. " + dbMessage(error));

  refresh();
  redirect(`/purchasing/${id}`);
}

export async function updatePurchaseOrder(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const parsed = readItems(fd);
  if ("error" in parsed) return fail(parsed.error);
  const supplierId = str(fd, "supplier_id");
  if (!supplierId) return fail("Choose a supplier.");
  const expected = optDate(fd, "expected_date");
  const ordered = optDate(fd, "order_date");
  if (ordered && expected && expected < ordered) return fail("Expected delivery can’t be before the order date.");

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      supplier_id: supplierId,
      category: oneOf(EXPENSE_CATEGORIES, str(fd, "category"), "materials"),
      boq_item_id: optStr(fd, "boq_item_id"),
      order_date: ordered ?? undefined,
      expected_date: expected,
      notes: optStr(fd, "notes"),
    })
    .eq("id", id)
    .is("expense_id", null);
  if (error) return fail("Couldn’t save the PO. " + dbMessage(error));

  const { error: itemsError } = await supabase.rpc("save_purchase_order_items", { po_id: id, items: parsed.items });
  if (itemsError) return fail("Couldn’t save the items. " + dbMessage(itemsError));

  refresh();
  redirect(`/purchasing/${id}`);
}

export async function setPoStatus(id: string, status: PoStatus) {
  const { supabase } = await getSession();
  let q = supabase
    .from("purchase_orders")
    .update({ status, received_date: status === "received" ? todayISO() : null })
    .eq("id", id);
  // A paid PO can't be cancelled or sent back to draft (its cost is already recorded).
  if (status === "cancelled" || status === "draft") q = q.is("expense_id", null);
  await q;
  refresh();
}

export async function payPurchaseOrder(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("pay_purchase_order", { po_id: id, paid_on: optDate(fd, "paid_date") });
  if (error) return fail(dbMessage(error));
  refresh();
  return ok();
}

export async function unpayPurchaseOrder(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("unpay_purchase_order", { po_id: id });
  if (error) return fail(dbMessage(error));
  refresh();
  return ok();
}

export async function deletePurchaseOrder(id: string): Promise<ActionState> {
  const { supabase, isOwner } = await getSession();
  if (!isOwner) return fail("Only an owner can delete purchase orders.");
  const { data } = await supabase.from("purchase_orders").select("expense_id").eq("id", id).maybeSingle();
  if (data?.expense_id) return fail("This PO is paid. Undo the payment first, or cancel it instead.");
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) return fail(dbMessage(error));
  refresh();
  redirect("/purchasing");
}
