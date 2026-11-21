"use server";

import { redirect } from "next/navigation";
import { parseBoqPaste, type BoqValues } from "@/lib/boq";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { dbMessage, fail, num, ok, oneOf, optStr, refresh, str } from "@/lib/formdata";
import { getSession } from "@/lib/org";
import type { ActionState } from "@/lib/types";

function readBoq(fd: FormData): { error: string } | { values: BoqValues } {
  const description = str(fd, "description");
  const quantity = str(fd, "quantity") === "" ? 1 : num(str(fd, "quantity"), 3);
  const unitCost = num(str(fd, "unit_cost"));
  if (!description) return { error: "Describe the item." };
  if (!(quantity >= 0)) return { error: "Quantity must be a number." };
  if (!(unitCost >= 0)) return { error: "Enter the unit cost (numbers only)." };
  return {
    values: {
      item_no: optStr(fd, "item_no"),
      description,
      category: oneOf(EXPENSE_CATEGORIES, str(fd, "category"), "materials"),
      unit: optStr(fd, "unit"),
      quantity,
      unit_cost: unitCost,
    },
  };
}

async function nextSortOrder(projectId: string) {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("boq_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function addBoqItem(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const parsed = readBoq(fd);
  if ("error" in parsed) return fail(parsed.error);
  const { error } = await supabase
    .from("boq_items")
    .insert({ ...parsed.values, org_id: orgId, project_id: projectId, sort_order: await nextSortOrder(projectId) });
  if (error) return fail("Couldn’t save the item. " + dbMessage(error));
  refresh();
  return ok();
}

export async function updateBoqItem(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const parsed = readBoq(fd);
  if ("error" in parsed) return fail(parsed.error);
  const { data, error } = await supabase.from("boq_items").update(parsed.values).eq("id", id).select("project_id").single();
  if (error) return fail("Couldn’t save the item. " + dbMessage(error));
  refresh();
  redirect(`/projects/${data.project_id}?tab=boq`);
}

export async function deleteBoqItem(id: string) {
  const { supabase } = await getSession();
  await supabase.from("boq_items").delete().eq("id", id);
  refresh();
}

export async function importBoq(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const { rows } = parseBoqPaste(String(fd.get("lines") ?? ""));
  if (rows.length === 0) {
    return fail("No items found. Copy the rows from Excel with columns: Item no., Description, Unit, Qty, Unit cost.");
  }
  let order = await nextSortOrder(projectId);
  const { error } = await supabase
    .from("boq_items")
    .insert(rows.map((r) => ({ ...r, org_id: orgId, project_id: projectId, sort_order: order++ })));
  if (error) return fail("Couldn’t import. " + dbMessage(error));
  refresh();
  return ok();
}

/** Sets the project's cost budget to the BOQ total. */
export async function applyBoqAsBudget(projectId: string) {
  const { supabase } = await getSession();
  const { data } = await supabase.from("project_summary").select("boq_total").eq("id", projectId).maybeSingle();
  if (!data) return;
  await supabase.from("projects").update({ budget: Number(data.boq_total) }).eq("id", projectId);
  refresh();
}
