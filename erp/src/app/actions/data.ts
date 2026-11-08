"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, PROJECT_STATUSES } from "@/lib/constants";
import { getSession } from "@/lib/org";
import type { ActionState } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const optDate = (fd: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(str(fd, k)) ? str(fd, k) : null);

/** Accepts "1,250,000", "₱ 1250000.50", etc. Returns NaN when not a number. */
function amount(fd: FormData, k: string) {
  const raw = str(fd, k).replace(/[₱,\s]/g, "");
  if (raw === "") return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

const oneOf = <T extends string>(list: { value: T }[], v: string, fallback: T): T =>
  (list.find((x) => x.value === v)?.value ?? fallback) as T;

const ok = (): ActionState => ({ ok: true, at: Date.now() });
const fail = (error: string): ActionState => ({ error, at: Date.now() });

function refresh() {
  revalidatePath("/", "layout");
}

// ─── Projects ────────────────────────────────────────────────────────────────

function readProject(fd: FormData) {
  const name = str(fd, "name");
  const contract = amount(fd, "contract_amount");
  const budget = str(fd, "budget") === "" ? 0 : amount(fd, "budget");
  if (!name) return { error: "Enter a project name." } as const;
  if (!(contract >= 0)) return { error: "Enter the contract amount (numbers only)." } as const;
  if (!(budget >= 0)) return { error: "Budget must be a number." } as const;

  const start = optDate(fd, "start_date");
  const end = optDate(fd, "end_date");
  if (start && end && end < start) return { error: "Target completion can’t be before the start date." } as const;

  return {
    values: {
      name,
      client_name: optStr(fd, "client_name"),
      location: optStr(fd, "location"),
      status: oneOf(PROJECT_STATUSES, str(fd, "status"), "active"),
      contract_amount: contract,
      budget,
      start_date: start,
      end_date: end,
      notes: optStr(fd, "notes"),
    },
  } as const;
}

export async function createProject(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const parsed = readProject(fd);
  if ("error" in parsed) return fail(parsed.error!);

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.values, org_id: orgId })
    .select("id")
    .single();
  if (error) return fail("Couldn’t save the project. " + error.message);

  refresh();
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const parsed = readProject(fd);
  if ("error" in parsed) return fail(parsed.error!);

  const { error } = await supabase.from("projects").update(parsed.values).eq("id", id);
  if (error) return fail("Couldn’t save the project. " + error.message);

  refresh();
  redirect(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const { supabase } = await getSession();
  await supabase.from("projects").delete().eq("id", id);
  refresh();
  redirect("/projects");
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function addExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const value = amount(fd, "amount");
  const description = str(fd, "description");
  const projectId = optStr(fd, "project_id");
  const category = oneOf(EXPENSE_CATEGORIES, str(fd, "category"), "other");

  if (!description) return fail("Describe what the cost was for.");
  if (!(value > 0)) return fail("Enter an amount greater than zero.");

  const { error } = await supabase.from("expenses").insert({
    org_id: orgId,
    project_id: projectId,
    date: optDate(fd, "date") ?? undefined,
    category,
    description,
    payee: optStr(fd, "payee"),
    amount: value,
  });
  if (error) return fail("Couldn’t save the cost. " + error.message);

  refresh();
  return ok();
}

export async function deleteExpense(id: string) {
  const { supabase } = await getSession();
  await supabase.from("expenses").delete().eq("id", id);
  refresh();
}

// ─── Change orders ───────────────────────────────────────────────────────────

export async function addChangeOrder(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const description = str(fd, "description");
  const value = amount(fd, "amount");
  if (!description) return fail("Describe the change.");
  if (!Number.isFinite(value) || value === 0) return fail("Enter the amount (use a minus sign for deductions).");

  const status = ["pending", "approved", "rejected"].includes(str(fd, "status")) ? str(fd, "status") : "pending";
  const { error } = await supabase.from("change_orders").insert({
    org_id: orgId,
    project_id: projectId,
    description,
    amount: value,
    status,
    date: optDate(fd, "date") ?? undefined,
  });
  if (error) return fail("Couldn’t save the change order. " + error.message);

  refresh();
  return ok();
}

export async function setChangeOrderStatus(id: string, status: "pending" | "approved" | "rejected") {
  const { supabase } = await getSession();
  await supabase.from("change_orders").update({ status }).eq("id", id);
  refresh();
}

export async function deleteChangeOrder(id: string) {
  const { supabase } = await getSession();
  await supabase.from("change_orders").delete().eq("id", id);
  refresh();
}

// ─── Billings ────────────────────────────────────────────────────────────────

export async function addBilling(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const projectId = str(fd, "project_id");
  const description = str(fd, "description");
  const value = amount(fd, "amount");
  if (!projectId) return fail("Choose a project.");
  if (!description) return fail("Describe the billing (e.g. Progress billing #2).");
  if (!(value > 0)) return fail("Enter an amount greater than zero.");

  const billed = optDate(fd, "billed_date");
  const due = optDate(fd, "due_date");
  if (billed && due && due < billed) return fail("Due date can’t be before the billing date.");

  const { error } = await supabase.from("billings").insert({
    org_id: orgId,
    project_id: projectId,
    reference: optStr(fd, "reference"),
    description,
    amount: value,
    billed_date: billed ?? undefined,
    due_date: due,
  });
  if (error) return fail("Couldn’t save the billing. " + error.message);

  refresh();
  return ok();
}

export async function deleteBilling(id: string) {
  const { supabase } = await getSession();
  await supabase.from("billings").delete().eq("id", id);
  refresh();
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function addPayment(billingId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const value = amount(fd, "amount");
  if (!(value > 0)) return fail("Enter an amount greater than zero.");

  const { data: billing } = await supabase
    .from("billing_summary")
    .select("balance")
    .eq("id", billingId)
    .maybeSingle();
  if (!billing) return fail("That billing no longer exists.");
  if (value > Number(billing.balance) + 0.005) {
    return fail(`That’s more than the remaining balance of ₱${Number(billing.balance).toLocaleString("en-PH")}.`);
  }

  const { error } = await supabase.from("payments").insert({
    org_id: orgId,
    billing_id: billingId,
    amount: value,
    date: optDate(fd, "date") ?? undefined,
    method: oneOf(PAYMENT_METHODS, str(fd, "method"), "bank_transfer"),
    reference: optStr(fd, "reference"),
  });
  if (error) return fail("Couldn’t record the payment. " + error.message);

  refresh();
  return ok();
}

export async function deletePayment(id: string) {
  const { supabase } = await getSession();
  await supabase.from("payments").delete().eq("id", id);
  refresh();
}
