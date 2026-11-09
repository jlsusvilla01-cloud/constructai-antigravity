import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectStatusBadge } from "@/components/badges";
import { BillingForm } from "@/components/billing-form";
import { BoqPanel } from "@/components/boq";
import { BreakdownBars } from "@/components/breakdown";
import { PoList } from "@/components/purchasing";
import {
  AddPanel,
  BillingList,
  ChangeOrderForm,
  ChangeOrderTable,
  ExpenseForm,
  ExpenseTable,
} from "@/components/records";
import { Card, CardHeader, LinkButton, Meter, PageHeader, Stat, cx } from "@/components/ui";
import { toBillingProject } from "@/lib/billing";
import { EXPENSE_CATEGORIES, labelOf } from "@/lib/constants";
import { fmtDate, php, pct, toNum } from "@/lib/format";
import { projectMetrics } from "@/lib/metrics";
import { getSession } from "@/lib/org";
import type { BillingSummary, BoqItem, ChangeOrder, Expense, Payment, ProjectSummary, PurchaseOrderSummary } from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "costs", label: "Costs" },
  { id: "billings", label: "Billings" },
  { id: "changes", label: "Change orders" },
  { id: "boq", label: "BOQ" },
  { id: "purchases", label: "Purchases" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("projects").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Project" };
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab, edit } = await searchParams;
  const tab = TABS.some((t) => t.id === rawTab) ? rawTab! : "overview";
  const { supabase, orgId, isOwner } = await getSession();

  const [{ data: project }, { data: expenses }, { data: billings }, { data: changes }, { data: boqRows }, { data: poRows }] = await Promise.all([
    supabase.from("project_summary").select("*").eq("id", id).eq("org_id", orgId).maybeSingle(),
    supabase.from("expenses").select("*").eq("project_id", id).order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("billing_summary").select("*").eq("project_id", id).order("billed_date", { ascending: false }),
    supabase.from("change_orders").select("*").eq("project_id", id).order("date", { ascending: false }),
    supabase.from("boq_items").select("*").eq("project_id", id).order("sort_order"),
    supabase.from("purchase_order_summary").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);
  if (!project) notFound();

  const p = project as ProjectSummary;
  const m = projectMetrics(p);
  const exp = (expenses ?? []) as Expense[];
  const bills = (billings ?? []) as BillingSummary[];
  const cos = (changes ?? []) as ChangeOrder[];
  const boq = (boqRows ?? []) as BoqItem[];
  const pos = (poRows ?? []) as PurchaseOrderSummary[];

  const actualByItem = new Map<string, number>();
  for (const e of exp) if (e.boq_item_id) actualByItem.set(e.boq_item_id, (actualByItem.get(e.boq_item_id) ?? 0) + toNum(e.amount));
  const committedByItem = new Map<string, number>();
  for (const po of pos) {
    if (po.boq_item_id && !po.expense_id && (po.status === "ordered" || po.status === "received")) {
      committedByItem.set(po.boq_item_id, (committedByItem.get(po.boq_item_id) ?? 0) + toNum(po.total));
    }
  }
  const unassigned = exp.filter((e) => !e.boq_item_id).reduce((s, e) => s + toNum(e.amount), 0);
  const boqOptions = boq.map((b) => ({ id: b.id, label: [b.item_no, b.description].filter(Boolean).join(" ") }));
  const boqNames = new Map(boqOptions.map((b) => [b.id, b.label]));

  const billingIds = bills.map((b) => b.id);
  const { data: payments } = billingIds.length
    ? await supabase.from("payments").select("*").in("billing_id", billingIds).order("date", { ascending: false })
    : { data: [] };

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    label: c.label,
    value: exp.filter((e) => e.category === c.value).reduce((s, e) => s + toNum(e.amount), 0),
  }));
  const pendingCO = cos.filter((c) => c.status === "pending");

  return (
    <>
      <PageHeader
        back={{ href: "/projects", label: "Projects" }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {p.name} <ProjectStatusBadge status={p.status} />
          </span>
        }
        sub={
          <>
            {[p.client_name, p.location].filter(Boolean).join(" · ")}
            {(p.start_date || p.end_date) && (
              <span className="block sm:ml-2 sm:inline">
                {fmtDate(p.start_date)} → {fmtDate(p.end_date)}
              </span>
            )}
          </>
        }
        actions={
          <LinkButton href={`/projects/${id}/edit`} variant="secondary">
            Edit project
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Contract"
          value={php(m.revised)}
          sub={
            toNum(p.approved_change_orders) !== 0
              ? `${php(p.contract_amount)} + ${php(p.approved_change_orders)} change orders`
              : "Original contract"
          }
        />
        <Stat
          label="Spent so far"
          value={php(m.cost)}
          tone={m.overBudget ? "loss" : m.committedOverBudget ? "warn" : undefined}
          sub={
            <>
              {m.budget > 0 ? `${pct(m.budgetUsed, 0)} of ${php(m.budget)} budget` : "No budget set"}
              {m.committed > 0 && <span className="block">+ {php(m.committed)} on open POs</span>}
            </>
          }
        />
        <Stat
          label="Collected"
          value={php(m.collected)}
          sub={m.receivable > 0 ? `${php(m.receivable)} still to collect` : `of ${php(m.billed)} billed`}
        />
        <Stat
          label="Projected profit"
          value={php(m.projectedProfit)}
          tone={m.projectedProfit < 0 ? "loss" : "gain"}
          sub={`${pct(m.projectedMargin)} margin`}
        />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "overview" ? `/projects/${id}` : `/projects/${id}?tab=${t.id}`}
            scroll={false}
            className={cx(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium",
              tab === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.id === "changes" && pendingCO.length > 0 && (
              <span className="ml-1.5 rounded-full bg-warn-soft px-1.5 text-xs text-warn">{pendingCO.length}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-5">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Profit picture" sub="How this job is tracking against the contract." />
              <div className="space-y-5 p-4 sm:p-5">
                <Row label="Contract (incl. approved change orders)" value={php(m.revised)} strong />
                <Row
                  label={p.status === "completed" ? "Final cost" : "Expected final cost"}
                  value={`− ${php(m.estFinalCost)}`}
                  hint={
                    p.status === "completed"
                      ? m.committed > 0
                        ? "Actual cost recorded, plus unpaid purchase orders."
                        : "Actual cost recorded."
                      : m.overBudget || m.committedOverBudget
                        ? "Spending (incl. open purchase orders) is past the budget, so that is used."
                        : "Your cost budget."
                  }
                />
                <div className="border-t border-line pt-4">
                  <Row
                    label="Projected profit"
                    value={php(m.projectedProfit)}
                    tone={m.projectedProfit < 0 ? "loss" : "gain"}
                    hint={`${pct(m.projectedMargin)} of contract`}
                    strong
                  />
                </div>

                <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>Budget used</span>
                      <span className="tabular-nums">{m.budget > 0 ? pct(m.budgetUsed, 0) : "—"}</span>
                    </div>
                    <Meter value={m.budgetUsed} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>{m.percentComplete > 0 ? "Work accomplished (billed)" : "Contract billed"}</span>
                      <span className="tabular-nums">{pct(m.percentComplete > 0 ? m.percentComplete : m.billedPct, 0)}</span>
                    </div>
                    <Meter value={m.percentComplete > 0 ? m.percentComplete : m.billedPct} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Cash on this job" sub="Money actually received vs. spent." />
              <div className="space-y-3 p-4 sm:p-5">
                <Row label="Collected from client" value={php(m.collected)} />
                <Row label="Spent" value={`− ${php(m.cost)}`} />
                <div className="border-t border-line pt-3">
                  <Row
                    label="Cash position"
                    value={php(m.cashPosition)}
                    tone={m.cashPosition < 0 ? "loss" : "gain"}
                    hint={m.cashPosition < 0 ? "You’re funding this job out of pocket." : "Client payments cover costs so far."}
                    strong
                  />
                </div>
                <div className="space-y-2 border-t border-line pt-3 text-sm">
                  <Row label="Billed, not yet paid" value={php(m.receivable)} />
                  {m.overdue > 0 && <Row label="Overdue" value={php(m.overdue)} tone="loss" />}
                  <Row label="Left to bill" value={php(m.remainingToBill)} />
                  {m.retentionHeld > 0 && (
                    <Row label="Retention held by client" value={php(m.retentionHeld)} hint="Billed when released after completion." />
                  )}
                  {m.downpaymentUnrecouped > 0 && <Row label="Downpayment still to recoup" value={php(m.downpaymentUnrecouped)} />}
                  {m.payable > 0 && <Row label="Delivered, unpaid to suppliers" value={php(m.payable)} tone="loss" />}
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader
                title="Where the money went"
                action={
                  <Link href={`/projects/${id}?tab=costs`} className="text-xs font-medium text-brand hover:underline">
                    All costs
                  </Link>
                }
              />
              <div className="p-4 sm:p-5">
                <BreakdownBars rows={byCategory} />
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Recent costs"
                action={
                  <Link href={`/projects/${id}?tab=costs`} className="text-xs font-medium text-brand hover:underline">
                    Add cost
                  </Link>
                }
              />
              {exp.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-muted">No costs yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {exp.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-ink">{e.description}</p>
                        <p className="text-xs text-muted">
                          {fmtDate(e.date)} · {labelOf(EXPENSE_CATEGORIES, e.category)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap font-medium tabular-nums text-ink">{php(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {p.notes && (
              <Card className="lg:col-span-5">
                <CardHeader title="Notes" />
                <p className="whitespace-pre-wrap p-4 text-sm text-ink sm:p-5">{p.notes}</p>
              </Card>
            )}
          </div>
        )}

        {tab === "costs" && (
          <Card>
            <CardHeader title="Costs" sub={`${exp.length} entries · ${php(m.cost)} total`} />
            <AddPanel label="Add a cost" defaultOpen={exp.length === 0}>
              <ExpenseForm projectId={id} boqItems={boqOptions} />
            </AddPanel>
            <ExpenseTable expenses={exp} boqNames={boqNames} canDelete={isOwner} />
          </Card>
        )}

        {tab === "billings" && (
          <Card>
            <CardHeader
              title="Billings & payments"
              sub={
                `${php(m.billed)} billed · ${php(m.collected)} collected · ${php(m.remainingToBill)} left to bill` +
                (m.retentionHeld > 0 ? ` · ${php(m.retentionHeld)} retention held` : "") +
                ` · retention ${toNum(p.retention_pct)}%, downpayment ${toNum(p.downpayment_pct)}%`
              }
              action={
                <Link href={`/projects/${id}/edit`} className="whitespace-nowrap text-xs font-medium text-brand hover:underline">
                  Billing terms
                </Link>
              }
            />
            <AddPanel label="Add a billing" defaultOpen={bills.length === 0}>
              <BillingForm projects={[toBillingProject(p)]} fixedProjectId={id} />
            </AddPanel>
            <BillingList billings={bills} payments={(payments ?? []) as Payment[]} canDelete={isOwner} />
          </Card>
        )}

        {tab === "changes" && (
          <Card>
            <CardHeader
              title="Change orders"
              sub="Approved change orders are added to the contract. Pending ones are not counted yet."
            />
            <AddPanel label="Add a change order">
              <ChangeOrderForm projectId={id} />
            </AddPanel>
            <ChangeOrderTable items={cos} canDelete={isOwner} />
          </Card>
        )}

        {tab === "boq" && (
          <BoqPanel
            projectId={id}
            items={boq}
            actualByItem={actualByItem}
            committedByItem={committedByItem}
            unassigned={unassigned}
            budget={m.budget}
            editId={edit}
          />
        )}

        {tab === "purchases" && (
          <Card>
            <CardHeader
              title="Purchase orders"
              sub={`${pos.length} POs · ${php(m.committed)} committed, not yet paid${m.payable > 0 ? ` · ${php(m.payable)} delivered & unpaid` : ""}`}
              action={
                <LinkButton href={`/purchasing/new?project=${id}`} className="px-3 py-1.5 text-xs">
                  + New PO
                </LinkButton>
              }
            />
            <PoList pos={pos} />
          </Card>
        )}
      </div>
    </>
  );
}

function Row({
  label,
  value,
  hint,
  tone,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "gain" | "loss";
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className={cx("text-sm", strong ? "font-medium text-ink" : "text-muted")}>{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <p
        className={cx(
          "whitespace-nowrap tabular-nums",
          strong ? "text-base font-semibold" : "text-sm font-medium",
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
