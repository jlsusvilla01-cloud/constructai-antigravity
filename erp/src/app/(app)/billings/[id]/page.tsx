import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BillingStatusBadge } from "@/components/badges";
import { DocumentCard, Letterhead, SignatureLines } from "@/components/document";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui";
import { labelOf, PAYMENT_METHODS } from "@/lib/constants";
import { fmtDate, php, phpExact, toNum } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { BillingSummary, Organization, Payment, ProjectSummary } from "@/lib/types";
import { pesoWords } from "@/lib/words";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("billings").select("reference, description").eq("id", id).maybeSingle();
  return { title: data ? data.reference || data.description : "Billing" };
}

const TITLE = {
  progress: "Progress billing",
  downpayment: "Billing — downpayment",
  retention_release: "Billing — retention release",
  other: "Billing statement",
} as const;

export default async function BillingDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await getSession();

  const { data: row } = await supabase.from("billing_summary").select("*").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!row) notFound();
  const b = row as BillingSummary;

  const [{ data: projectRow }, { data: siblingRows }, { data: paymentRows }, { data: orgRow }] = await Promise.all([
    supabase.from("project_summary").select("*").eq("id", b.project_id).maybeSingle(),
    supabase.from("billings").select("id, kind, gross_amount, billed_date, created_at").eq("project_id", b.project_id),
    supabase.from("payments").select("*").eq("billing_id", id).order("date"),
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
  ]);
  const p = projectRow as ProjectSummary;
  const org = orgRow as Organization | null;
  const payments = (paymentRows ?? []) as Payment[];

  // Work billed before this one (progress and fixed-amount billings, in billing order).
  const before = (x: { billed_date: string; created_at: string }) =>
    x.billed_date < b.billed_date || (x.billed_date === b.billed_date && x.created_at < b.created_at);
  const previousWork = (siblingRows ?? [])
    .filter((x) => x.id !== b.id && (x.kind === "progress" || x.kind === "other") && before(x))
    .reduce((s, x) => s + toNum(x.gross_amount), 0);
  const workToDate = previousWork + toNum(b.gross_amount);
  const isProgress = b.kind === "progress";

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          back={{ href: `/projects/${b.project_id}?tab=billings`, label: p?.name ?? "Project" }}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {b.reference || b.description} <BillingStatusBadge status={b.status} />
            </span>
          }
          sub={`${php(b.amount)} due · ${php(b.paid)} received · ${php(b.balance)} balance`}
          actions={<PrintButton />}
        />
      </div>

      <DocumentCard>
        <Letterhead
          org={org}
          title={TITLE[b.kind]}
          meta={[
            ["Reference", b.reference || "—"],
            ["Date", fmtDate(b.billed_date)],
            ...(b.due_date ? ([["Due", fmtDate(b.due_date)]] as [string, string][]) : []),
          ]}
        />

        <div className="grid gap-5 border-b border-line py-5 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Billed to</p>
            <p className="mt-1 font-medium text-ink">{p?.client_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Project</p>
            <p className="mt-1 font-medium text-ink">{p?.name}</p>
            {p?.location && <p className="text-sm text-muted">{p.location}</p>}
          </div>
        </div>

        <p className="pt-5 font-medium text-ink">{b.description}</p>

        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-line">
            {isProgress ? (
              <>
                <Line label="Original contract amount" value={phpExact(p?.contract_amount)} />
                {toNum(p?.approved_change_orders) !== 0 && <Line label="Approved change orders" value={phpExact(p?.approved_change_orders)} />}
                <Line label="Revised contract amount" value={phpExact(p?.revised_contract)} strong />
                <Line
                  label={`Work accomplished to date (${toNum(b.percent_complete)}%)`}
                  value={phpExact(workToDate)}
                />
                <Line label="Less: work billed previously" value={`(${phpExact(previousWork)})`} />
                <Line label="Work accomplished this billing" value={phpExact(b.gross_amount)} strong />
                {toNum(b.retention_amount) > 0 && (
                  <Line label={`Less: retention (${toNum(p?.retention_pct)}%)`} value={`(${phpExact(b.retention_amount)})`} />
                )}
                {toNum(b.recoupment_amount) > 0 && (
                  <Line label="Less: recoupment of downpayment" value={`(${phpExact(b.recoupment_amount)})`} />
                )}
              </>
            ) : (
              <Line label={b.description} value={phpExact(b.gross_amount)} />
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/20">
              <td className="py-3 pr-3 font-semibold text-ink">Amount due</td>
              <td className="py-3 text-right text-base font-semibold tabular-nums text-ink">{phpExact(b.amount)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-sm italic text-muted">{pesoWords(toNum(b.amount))}</p>

        {payments.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Payments received</p>
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-line">
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-2 pr-3 text-ink">
                      {fmtDate(pay.date)} · {labelOf(PAYMENT_METHODS, pay.method)}
                      {pay.reference && <span className="text-muted"> · {pay.reference}</span>}
                      <Link href={`/billings/${b.id}/receipt/${pay.id}`} className="ml-2 text-xs font-medium text-brand hover:underline print:hidden">
                        Receipt
                      </Link>
                    </td>
                    <td className="py-2 text-right tabular-nums text-ink">{phpExact(pay.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 font-medium text-ink">Balance</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-ink">{phpExact(b.balance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-sm text-muted">Please make checks payable to {org?.name}.</p>
        <SignatureLines labels={["Prepared by", "Received by (client)"]} />
      </DocumentCard>
    </>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <tr>
      <td className={strong ? "py-2 pr-3 font-medium text-ink" : "py-2 pr-3 text-muted"}>{label}</td>
      <td className={strong ? "py-2 text-right font-medium tabular-nums text-ink" : "py-2 text-right tabular-nums text-ink"}>
        {value}
      </td>
    </tr>
  );
}
