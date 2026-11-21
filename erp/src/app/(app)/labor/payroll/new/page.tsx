import type { Metadata } from "next";
import { recordPayroll } from "@/app/actions/labor";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, CardHeader, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { fmtDate, php, phpExact, todayISO } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { Attendance } from "@/lib/types";

export const metadata: Metadata = { title: "Run payroll" };

/** Monday–Saturday of the week containing `iso` (Philippine sites usually pay weekly, Saturdays). */
function weekOf(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const mondayOffset = (d.getUTCDay() + 6) % 7;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() - mondayOffset);
  const sat = new Date(mon);
  sat.setUTCDate(mon.getUTCDate() + 5);
  return [mon.toISOString().slice(0, 10), sat.toISOString().slice(0, 10)];
}

const isDate = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

export default async function NewPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, orgId } = await getSession();
  const [defFrom, defTo] = weekOf(todayISO());
  const from = isDate(sp.from) ? sp.from! : defFrom;
  const to = isDate(sp.to) ? sp.to! : defTo;

  const { data: projectRows } = await supabase
    .from("project_summary")
    .select("id, name, unpaid_labor, status")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  const projects = (projectRows ?? []).filter((p) => p.status !== "cancelled");
  const projectId = sp.project && projects.some((p) => p.id === sp.project) ? sp.project : "";

  let rows: (Attendance & { workers: { name: string; position: string | null } | null })[] = [];
  if (projectId) {
    const { data } = await supabase
      .from("attendance")
      .select("*, workers(name, position)")
      .eq("project_id", projectId)
      .is("payroll_run_id", null)
      .gte("date", from)
      .lte("date", to);
    rows = (data ?? []) as typeof rows;
  }

  type Line = { name: string; position: string | null; days: number; ot: number; amount: number };
  const lines = new Map<string, Line>();
  for (const r of rows) {
    const l = lines.get(r.worker_id) ?? { name: r.workers?.name ?? "Worker", position: r.workers?.position ?? null, days: 0, ot: 0, amount: 0 };
    l.days += Number(r.days);
    l.ot += Number(r.ot_hours);
    l.amount += Number(r.amount);
    lines.set(r.worker_id, l);
  }
  const list = [...lines.values()].sort((a, b) => a.name.localeCompare(b.name));
  const total = list.reduce((s, l) => s + l.amount, 0);

  return (
    <>
      <PageHeader back={{ href: "/labor?view=payroll", label: "Labor" }} title="Run payroll" sub="Pays the site log entries of one project for a period, and records the total as a labor cost." />

      <Card className="mb-4">
        <form className="grid items-end gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:p-5">
          <Field label="Project">
            <Select name="project" defaultValue={projectId} required>
              <option value="" disabled>
                Choose a project…
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {Number(p.unpaid_labor) > 0 ? ` — ${php(p.unpaid_labor)} unpaid` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input name="from" type="date" defaultValue={from} />
          </Field>
          <Field label="To">
            <Input name="to" type="date" defaultValue={to} />
          </Field>
          <button className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas">Show</button>
        </form>
      </Card>

      {projectId && (
        <Card>
          <CardHeader title={`Unpaid days, ${fmtDate(from)} – ${fmtDate(to)}`} sub={`${list.length} workers · ${php(total)}`} />
          {list.length === 0 ? (
            <EmptyState title="Nothing to pay for this period">Log attendance on the project’s Site log tab first, or pick another period.</EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-line bg-canvas/60 text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium sm:px-5">Worker</th>
                      <th className="px-3 py-2.5 text-right font-medium">Days</th>
                      <th className="px-3 py-2.5 text-right font-medium">OT hrs</th>
                      <th className="px-4 py-2.5 text-right font-medium sm:px-5">Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.map((l) => (
                      <tr key={l.name}>
                        <td className="px-4 py-2.5 sm:px-5">
                          <p className="font-medium text-ink">{l.name}</p>
                          {l.position && <p className="text-xs text-muted">{l.position}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink">{l.days}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink">{l.ot || "—"}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink sm:px-5">{phpExact(l.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-line">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-ink sm:px-5">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-ink sm:px-5">{phpExact(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <ActionForm action={recordPayroll} resetOnSuccess={false} className="flex flex-wrap items-end justify-end gap-3 border-t border-line px-4 py-4 sm:px-5">
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="from" value={from} />
                <input type="hidden" name="to" value={to} />
                <Field label="Date paid">
                  <Input name="paid_on" type="date" defaultValue={todayISO()} className="w-40" />
                </Field>
                <SubmitButton pendingText="Recording…">Record payroll · {php(total)}</SubmitButton>
              </ActionForm>
            </>
          )}
        </Card>
      )}
    </>
  );
}
