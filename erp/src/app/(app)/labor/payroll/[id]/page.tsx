import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { undoPayroll } from "@/app/actions/labor";
import { DocumentCard, Letterhead, SignatureLines } from "@/components/document";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui";
import { fmtDate, php, phpExact } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { Attendance, Organization, PayrollRun } from "@/lib/types";

export const metadata: Metadata = { title: "Payroll" };

export default async function PayrollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, isOwner } = await getSession();
  const { data: runRow } = await supabase.from("payroll_runs").select("*").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!runRow) notFound();
  const run = runRow as PayrollRun;

  const [{ data: rows }, { data: project }, { data: orgRow }] = await Promise.all([
    supabase.from("attendance").select("*, workers(name, position)").eq("payroll_run_id", id),
    supabase.from("projects").select("name, location").eq("id", run.project_id).maybeSingle(),
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
  ]);
  const org = orgRow as Organization | null;

  type Line = { name: string; position: string | null; days: number; ot: number; rate: number; amount: number };
  const lines = new Map<string, Line>();
  for (const r of (rows ?? []) as (Attendance & { workers: { name: string; position: string | null } | null })[]) {
    const l = lines.get(r.worker_id) ?? { name: r.workers?.name ?? "Worker", position: r.workers?.position ?? null, days: 0, ot: 0, rate: Number(r.daily_rate), amount: 0 };
    l.days += Number(r.days);
    l.ot += Number(r.ot_hours);
    l.amount += Number(r.amount);
    lines.set(r.worker_id, l);
  }
  const list = [...lines.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          back={{ href: "/labor?view=payroll", label: "Payroll" }}
          title={`Payroll — ${project?.name ?? "Project"}`}
          sub={`${fmtDate(run.period_start)} – ${fmtDate(run.period_end)} · ${php(run.total)} recorded as a labor cost`}
          actions={
            <>
              <PrintButton />
              {isOwner && (
                <ActionForm action={undoPayroll.bind(null, id)} resetOnSuccess={false}>
                  <SubmitButton variant="secondary" pendingText="Undoing…">
                    Undo payroll
                  </SubmitButton>
                </ActionForm>
              )}
            </>
          }
        />
      </div>

      <DocumentCard>
        <Letterhead
          org={org}
          title="Payroll"
          meta={[
            ["Project", project?.name ?? "—"],
            ["Period", `${fmtDate(run.period_start)} – ${fmtDate(run.period_end)}`],
          ]}
        />
        <div className="overflow-x-auto">
          <table className="mt-4 w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="py-2.5 pr-3 text-left font-medium">Worker</th>
                <th className="py-2.5 pr-3 text-right font-medium">Rate/day</th>
                <th className="py-2.5 pr-3 text-right font-medium">Days</th>
                <th className="py-2.5 pr-3 text-right font-medium">OT hrs</th>
                <th className="py-2.5 pr-3 text-right font-medium">Amount</th>
                <th className="w-40 py-2.5 text-left font-medium">Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((l) => (
                <tr key={l.name}>
                  <td className="py-3 pr-3">
                    <p className="text-ink">{l.name}</p>
                    {l.position && <p className="text-xs text-muted">{l.position}</p>}
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink">{phpExact(l.rate)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink">{l.days}</td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink">{l.ot || "—"}</td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink">{phpExact(l.amount)}</td>
                  <td className="py-3">
                    <div className="h-6 border-b border-ink/30" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/20">
                <td colSpan={4} className="py-3 pr-3 text-right font-medium text-ink">
                  Total
                </td>
                <td className="py-3 pr-3 text-right text-base font-semibold tabular-nums text-ink">{phpExact(run.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">Overtime paid at 125% of the hourly rate (daily rate ÷ 8).</p>
        <SignatureLines labels={["Prepared by", "Approved by"]} />
      </DocumentCard>
    </>
  );
}
