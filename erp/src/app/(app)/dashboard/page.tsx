import Link from "next/link";
import type { Metadata } from "next";
import { CashFlowChart, type MonthPoint } from "@/components/charts";
import { Card, CardHeader, EmptyState, LinkButton, Meter, Stat, cx } from "@/components/ui";
import { php, pct, toNum, todayISO } from "@/lib/format";
import { projectMetrics } from "@/lib/metrics";
import { getSession } from "@/lib/org";
import type { ProjectSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

const PERIODS = [
  { value: "ytd", label: "This year" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

const monthKey = (d: string) => d.slice(0, 7);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: rawPeriod } = await searchParams;
  const period = PERIODS.some((p) => p.value === rawPeriod) ? rawPeriod! : "ytd";
  const { supabase, orgId, orgName } = await getSession();

  const today = todayISO();
  const now = new Date(`${today}T00:00:00`);
  const first = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const chartStart = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-01`;
  const periodStart =
    period === "ytd" ? `${now.getFullYear()}-01-01` : period === "12m" ? chartStart : "0001-01-01";
  const fetchFrom = periodStart < chartStart ? periodStart : chartStart;

  const [{ data: projectRows }, { data: paymentRows }, { data: expenseRows }] = await Promise.all([
    supabase.from("project_summary").select("*").eq("org_id", orgId),
    supabase.from("payments").select("date, amount").eq("org_id", orgId).gte("date", fetchFrom),
    supabase.from("expenses").select("date, amount, project_id").eq("org_id", orgId).gte("date", fetchFrom),
  ]);
  const projects = (projectRows ?? []) as ProjectSummary[];
  const payments = (paymentRows ?? []) as { date: string; amount: number }[];
  const expenses = (expenseRows ?? []) as { date: string; amount: number; project_id: string | null }[];

  // ── Period totals (cash basis: money in when the client pays, out when you spend)
  const inPeriod = <T extends { date: string }>(r: T) => r.date >= periodStart && r.date <= today;
  const collected = payments.filter(inPeriod).reduce((s, r) => s + toNum(r.amount), 0);
  const periodExp = expenses.filter(inPeriod);
  const spent = periodExp.reduce((s, r) => s + toNum(r.amount), 0);
  const overhead = periodExp.filter((r) => !r.project_id).reduce((s, r) => s + toNum(r.amount), 0);
  const net = collected - spent;

  const receivable = projects.reduce((s, p) => s + toNum(p.receivable), 0);
  const overdue = projects.reduce((s, p) => s + toNum(p.overdue), 0);

  // ── Monthly chart, last 12 months
  const months: MonthPoint[] = [];
  const idx = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    idx.set(key, months.length);
    months.push({ label: d.toLocaleString("en-PH", { month: "short" }), inflow: 0, outflow: 0 });
  }
  for (const r of payments) {
    const i = idx.get(monthKey(r.date));
    if (i !== undefined) months[i].inflow += toNum(r.amount);
  }
  for (const r of expenses) {
    const i = idx.get(monthKey(r.date));
    if (i !== undefined) months[i].outflow += toNum(r.amount);
  }

  // ── Active projects & what needs attention
  const active = projects
    .filter((p) => p.status === "active" || p.status === "on_hold")
    .map((p) => ({ p, m: projectMetrics(p) }))
    .sort((a, b) => b.m.revised - a.m.revised);
  const backlog = active.reduce((s, x) => s + x.m.remainingToBill, 0);
  const activeProfit = active.reduce((s, x) => s + x.m.projectedProfit, 0);
  const activeContract = active.reduce((s, x) => s + x.m.revised, 0);

  type Alert = { id: string; name: string; text: string; tone: "loss" | "warn" };
  const alerts: Alert[] = [];
  for (const { p, m } of active) {
    if (m.overdue > 0) alerts.push({ id: p.id, name: p.name, text: `${php(m.overdue)} overdue from client`, tone: "loss" });
    if (m.overBudget) alerts.push({ id: p.id, name: p.name, text: `Over budget by ${php(m.cost - m.budget)}`, tone: "loss" });
    else if (m.committedOverBudget)
      alerts.push({ id: p.id, name: p.name, text: `Spent + open POs exceed budget by ${php(m.cost + m.committed - m.budget)}`, tone: "warn" });
    else if (m.budgetUsed > 90) alerts.push({ id: p.id, name: p.name, text: `${pct(m.budgetUsed, 0)} of budget used`, tone: "warn" });
    if (m.payable > 0) alerts.push({ id: p.id, name: p.name, text: `${php(m.payable)} delivered, unpaid to suppliers`, tone: "warn" });
    if (m.projectedProfit < 0) alerts.push({ id: p.id, name: p.name, text: `Heading for a ${php(-m.projectedProfit)} loss`, tone: "loss" });
    if (p.end_date && p.end_date < today && p.status === "active")
      alerts.push({ id: p.id, name: p.name, text: "Past target completion date", tone: "warn" });
  }

  // Completed jobs where the client still holds retention: time to bill its release.
  for (const p of projects) {
    const held = toNum(p.retention_held);
    if (p.status === "completed" && held > 0)
      alerts.push({ id: p.id, name: p.name, text: `${php(held)} retention to collect — bill its release`, tone: "warn" });
  }
  const retentionHeld = projects.reduce((s, p) => s + toNum(p.retention_held), 0);

  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">{orgName} — how the business is doing.</p>
        </div>
        <div className="flex rounded-lg border border-line bg-surface p-0.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={p.value === "ytd" ? "/dashboard" : `/dashboard?period=${p.value}`}
              className={cx(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                period === p.value ? "bg-ink text-white" : "text-muted hover:text-ink",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <EmptyState title="Welcome! Start by adding your first project.">
            <p>Then record costs as you spend and billings as you invoice — your profit shows up here.</p>
            <LinkButton href="/projects/new" className="mt-4">
              + New project
            </LinkButton>
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Collected" value={php(collected)} sub={`From clients, ${periodLabel}`} />
            <Stat label="Spent" value={php(spent)} sub={`Incl. ${php(overhead)} overhead`} />
            <Stat
              label="Net profit"
              value={php(net)}
              tone={net < 0 ? "loss" : "gain"}
              sub={collected > 0 ? `${pct((net / collected) * 100)} of collections` : "Collected minus spent"}
            />
            <Stat
              label="Still to collect"
              value={php(receivable)}
              tone={overdue > 0 ? "warn" : undefined}
              sub={
                <>
                  {overdue > 0 ? <span className="text-loss">{php(overdue)} overdue</span> : "Nothing overdue"}
                  {retentionHeld > 0 && <span className="block">+ {php(retentionHeld)} retention held</span>}
                </>
              }
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Money in vs. money out" sub="Last 12 months, by month. Hover or tap a month for details." />
              <div className="p-4 sm:p-5">
                <CashFlowChart data={months} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Needs attention" sub={alerts.length ? `${alerts.length} items` : undefined} />
              {alerts.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">All active projects look healthy.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {alerts.slice(0, 8).map((a, i) => (
                    <li key={i}>
                      <Link href={`/projects/${a.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-canvas/60 sm:px-5">
                        <span
                          className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.tone === "loss" ? "bg-loss" : "bg-warn")}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{a.name}</span>
                          <span className="block text-xs text-muted">{a.text}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader
              title="Active projects"
              sub={`${active.length} projects · ${php(activeContract)} in contracts · ${php(backlog)} left to bill · ${php(activeProfit)} projected profit`}
              action={
                <Link href="/projects" className="whitespace-nowrap text-xs font-medium text-brand hover:underline">
                  All projects
                </Link>
              }
            />
            {active.length === 0 ? (
              <EmptyState title="No active projects" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-line bg-canvas/60 text-xs text-muted">
                    <tr>
                      <th className="px-5 py-2.5 text-left font-medium">Project</th>
                      <th className="px-3 py-2.5 text-right font-medium">Contract</th>
                      <th className="w-44 px-3 py-2.5 text-left font-medium">Spent vs budget</th>
                      <th className="px-3 py-2.5 text-right font-medium">Collected</th>
                      <th className="px-5 py-2.5 text-right font-medium">Projected profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {active.map(({ p, m }) => (
                      <tr key={p.id} className="hover:bg-canvas/50">
                        <td className="px-5 py-3">
                          <Link href={`/projects/${p.id}`} className="font-medium text-ink hover:text-brand">
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted">{p.client_name}</p>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-ink">{php(m.revised)}</td>
                        <td className="px-3 py-3">
                          <div className="mb-1 flex justify-between text-xs tabular-nums text-muted">
                            <span>{php(m.cost)}</span>
                            <span className={cx(m.overBudget && "font-medium text-loss")}>
                              {m.budget > 0 ? pct(m.budgetUsed, 0) : "—"}
                            </span>
                          </div>
                          <Meter value={m.budgetUsed} />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-ink">
                          {php(m.collected)}
                          <p className="text-xs text-muted">{pct(m.revised > 0 ? (m.collected / m.revised) * 100 : NaN, 0)} of contract</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p className={cx("font-semibold tabular-nums", m.projectedProfit < 0 ? "text-loss" : "text-gain")}>
                            {php(m.projectedProfit)}
                          </p>
                          <p className="text-xs tabular-nums text-muted">{pct(m.projectedMargin)} margin</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
