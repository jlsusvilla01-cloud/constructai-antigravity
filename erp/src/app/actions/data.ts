"use server";

import { redirect } from "next/navigation";
import { computeProgressBilling, round2 } from "@/lib/billing";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, PROJECT_STATUSES } from "@/lib/constants";
import { amount, dbMessage, fail, num, ok, oneOf, optDate, optStr, refresh, str } from "@/lib/formdata";
import { getSession } from "@/lib/org";
import type { ActionState, ProjectSummary } from "@/lib/types";

/** Deleting is reserved for owners (row-level security enforces it too). */
async function ownerSession() {
  const session = await getSession();
  return session.isOwner ? session : null;
}

// ─── Projects ────────────────────────────────────────────────────────────────

function readProject(fd: FormData) {
  const name = str(fd, "name");
  const contract = amount(fd, "contract_amount");
  const budget = str(fd, "budget") === "" ? 0 : amount(fd, "budget");
  const retention = str(fd, "retention_pct") === "" ? 0 : num(str(fd, "retention_pct"));
  const downpayment = str(fd, "downpayment_pct") === "" ? 0 : num(str(fd, "downpayment_pct"));
  if (!name) return { error: "Enter a project name." } as const;
  if (!(contract >= 0)) return { error: "Enter the contract amount (numbers only)." } as const;
  if (!(budget >= 0)) return { error: "Budget must be a number." } as const;
  if (!(retention >= 0 && retention <= 100)) return { error: "Retention must be between 0 and 100%." } as const;
  if (!(downpayment >= 0 && downpayment <= 100)) return { error: "Downpayment must be between 0 and 100%." } as const;

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
      retention_pct: retention,
      downpayment_pct: downpayment,
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
  if (error) return fail("Couldn’t save the project. " + dbMessage(error));

  refresh();
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  const parsed = readProject(fd);
  if ("error" in parsed) return fail(parsed.error!);

  const { error } = await supabase.from("projects").update(parsed.values).eq("id", id);
  if (error) return fail("Couldn’t save the project. " + dbMessage(error));

  refresh();
  redirect(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const session = await ownerSession();
  if (!session) return;
  await session.supabase.from("projects").delete().eq("id", id);
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
    boq_item_id: projectId ? optStr(fd, "boq_item_id") : null,
    date: optDate(fd, "date") ?? undefined,
    category,
    description,
    payee: optStr(fd, "payee"),
    amount: value,
  });
  if (error) return fail("Couldn’t save the cost. " + dbMessage(error));

  refresh();
  return ok();
}

export async function deleteExpense(id: string) {
  const session = await ownerSession();
  if (!session) return;
  await session.supabase.from("expenses").delete().eq("id", id);
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
  if (error) return fail("Couldn’t save the change order. " + dbMessage(error));

  refresh();
  return ok();
}

export async function setChangeOrderStatus(id: string, status: "pending" | "approved" | "rejected") {
  const { supabase } = await getSession();
  await supabase.from("change_orders").update({ status }).eq("id", id);
  refresh();
}

export async function deleteChangeOrder(id: string) {
  const session = await ownerSession();
  if (!session) return;
  await session.supabase.from("change_orders").delete().eq("id", id);
  refresh();
}

// ─── Billings ────────────────────────────────────────────────────────────────

const BILLING_KINDS = ["progress", "downpayment", "retention_release", "other"] as const;

export async function addBilling(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId } = await getSession();
  const projectId = str(fd, "project_id");
  const kind = BILLING_KINDS.find((k) => k === str(fd, "kind")) ?? "other";
  const billed = optDate(fd, "billed_date");
  const due = optDate(fd, "due_date");
  if (!projectId) return fail("Choose a project.");
  if (billed && due && due < billed) return fail("Due date can’t be before the billing date.");

  const { data: projectRow } = await supabase.from("project_summary").select("*").eq("id", projectId).maybeSingle();
  if (!projectRow) return fail("That project no longer exists.");
  const p = projectRow as ProjectSummary;

  let description = str(fd, "description");
  let values: {
    amount: number;
    gross_amount: number;
    retention_amount: number;
    recoupment_amount: number;
    percent_complete: number | null;
  };

  if (kind === "progress") {
    const cumulativePct = num(str(fd, "percent_complete"));
    const r = computeProgressBilling({
      revisedContract: Number(p.revised_contract),
      retentionPct: Number(p.retention_pct),
      downpaymentBilled: Number(p.downpayment_billed),
      downpaymentRecouped: Number(p.downpayment_recouped),
      prevGross: Number(p.progress_billed_gross),
      prevPct: Number(p.percent_complete),
      cumulativePct,
    });
    if ("error" in r) return fail(r.error);
    values = {
      amount: r.net,
      gross_amount: r.gross,
      retention_amount: r.retention,
      recoupment_amount: r.recoupment,
      percent_complete: cumulativePct,
    };
    description ||= `Progress billing — ${cumulativePct}% complete`;
  } else {
    const value = amount(fd, "amount");
    if (!(value > 0)) return fail("Enter an amount greater than zero.");
    if (kind === "retention_release" && value > Number(p.retention_held) + 0.005) {
      return fail(`Only ₱${Number(p.retention_held).toLocaleString("en-PH")} of retention is being held.`);
    }
    values = { amount: round2(value), gross_amount: round2(value), retention_amount: 0, recoupment_amount: 0, percent_complete: null };
    description ||= kind === "downpayment" ? "Downpayment" : kind === "retention_release" ? "Release of retention" : "";
  }
  if (!description) return fail("Describe the billing (e.g. Progress billing #2).");

  const { error } = await supabase.from("billings").insert({
    org_id: orgId,
    project_id: projectId,
    kind,
    reference: optStr(fd, "reference"),
    description,
    ...values,
    billed_date: billed ?? undefined,
    due_date: due,
  });
  if (error) return fail("Couldn’t save the billing. " + dbMessage(error));

  refresh();
  return ok();
}

export async function deleteBilling(id: string) {
  const session = await ownerSession();
  if (!session) return;
  await session.supabase.from("billings").delete().eq("id", id);
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
  if (error) return fail("Couldn’t record the payment. " + dbMessage(error));

  refresh();
  return ok();
}

export async function deletePayment(id: string) {
  const session = await ownerSession();
  if (!session) return;
  await session.supabase.from("payments").delete().eq("id", id);
  refresh();
}
