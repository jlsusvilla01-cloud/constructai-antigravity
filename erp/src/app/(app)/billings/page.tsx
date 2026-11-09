import Link from "next/link";
import type { Metadata } from "next";
import { BillingForm } from "@/components/billing-form";
import { AddPanel, BillingList } from "@/components/records";
import { Card, CardHeader, PageHeader, Stat, cx } from "@/components/ui";
import { php, toNum } from "@/lib/format";
import { getSession } from "@/lib/org";
import { toBillingProject } from "@/lib/billing";
import type { BillingSummary, Payment, ProjectSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Billings" };

const FILTERS = [
  { value: "open", label: "To collect" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
];

export default async function BillingsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show = "open" } = await searchParams;
  const { supabase, orgId, isOwner } = await getSession();

  const [{ data: billingRows }, { data: projectRows }] = await Promise.all([
    supabase.from("billing_summary").select("*").eq("org_id", orgId).order("billed_date", { ascending: false }),
    supabase.from("project_summary").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
  ]);
  const all = (billingRows ?? []) as BillingSummary[];
  const projects = (projectRows ?? []) as ProjectSummary[];
  const projectNames = new Map(projects.map((p) => [p.id, p.name]));

  const outstanding = all.filter((b) => b.status !== "paid");
  const overdue = all.filter((b) => b.status === "overdue");
  const sum = (list: BillingSummary[], k: "balance" | "amount" | "paid") => list.reduce((s, b) => s + toNum(b[k]), 0);

  const shown =
    show === "overdue" ? overdue : show === "paid" ? all.filter((b) => b.status === "paid") : show === "all" ? all : outstanding;
  // Oldest due first when chasing collections.
  if (show === "open" || show === "overdue") {
    shown.sort((a, b) => (a.due_date ?? a.billed_date).localeCompare(b.due_date ?? b.billed_date));
  }

  const ids = shown.map((b) => b.id);
  const { data: payments } = ids.length
    ? await supabase.from("payments").select("*").in("billing_id", ids).order("date", { ascending: false })
    : { data: [] };

  const open = projects.filter((p) => p.status !== "cancelled" && p.status !== "bidding").map(toBillingProject);
  const retentionHeld = projects.reduce((s, p) => s + toNum(p.retention_held), 0);

  return (
    <>
      <PageHeader title="Billings" sub="What you’ve invoiced clients, and what’s still owed to you." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Still to collect" value={php(sum(outstanding, "balance"))} sub={`${outstanding.length} open billings`} />
        <Stat
          label="Overdue"
          value={php(sum(overdue, "balance"))}
          tone={overdue.length ? "loss" : undefined}
          sub={overdue.length ? `${overdue.length} past due date` : "Nothing overdue"}
        />
        <Stat
          label="Collected all-time"
          value={php(sum(all, "paid"))}
          sub={
            retentionHeld > 0
              ? `of ${php(sum(all, "amount"))} billed · ${php(retentionHeld)} retention held by clients`
              : `of ${php(sum(all, "amount"))} billed`
          }
        />
      </div>

      <Card>
        <CardHeader title="Billings" sub="Tap a billing to record a payment." />
        <AddPanel label="Add a billing">
          <BillingForm projects={open} />
        </AddPanel>
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line px-4 py-2.5 sm:px-5">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "open" ? "/billings" : `/billings?show=${f.value}`}
              className={cx(
                "whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium",
                show === f.value ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <BillingList billings={shown} payments={(payments ?? []) as Payment[]} projectNames={projectNames} canDelete={isOwner} />
      </Card>
    </>
  );
}
