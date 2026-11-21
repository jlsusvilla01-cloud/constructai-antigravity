import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentCard, Letterhead, SignatureLines } from "@/components/document";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/ui";
import { labelOf, PAYMENT_METHODS } from "@/lib/constants";
import { fmtDate, phpExact, toNum } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { BillingSummary, Organization, Payment } from "@/lib/types";
import { pesoWords } from "@/lib/words";

export const metadata: Metadata = { title: "Acknowledgment receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const { id, paymentId } = await params;
  const { supabase, orgId } = await getSession();

  const [{ data: payRow }, { data: billRow }, { data: orgRow }] = await Promise.all([
    supabase.from("payments").select("*").eq("id", paymentId).eq("billing_id", id).eq("org_id", orgId).maybeSingle(),
    supabase.from("billing_summary").select("*").eq("id", id).maybeSingle(),
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
  ]);
  if (!payRow || !billRow) notFound();
  const pay = payRow as Payment;
  const b = billRow as BillingSummary;
  const org = orgRow as Organization | null;
  const { data: project } = await supabase.from("projects").select("name, client_name").eq("id", b.project_id).maybeSingle();

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          back={{ href: `/billings/${id}`, label: b.reference || b.description }}
          title="Acknowledgment receipt"
          sub="Proof of payment for your client. Not a BIR official receipt."
          actions={<PrintButton />}
        />
      </div>
      <div className="mx-auto max-w-2xl print:max-w-none">
        <DocumentCard>
          <Letterhead
            org={org}
            title="Acknowledgment receipt"
            meta={[
              ["Date", fmtDate(pay.date)],
              ["Billing", b.reference || "—"],
            ]}
          />
          <div className="space-y-4 py-6 text-sm leading-relaxed text-ink">
            <p>
              Received from <span className="font-semibold">{project?.client_name || "the client"}</span> the sum of{" "}
              <span className="font-semibold">{pesoWords(toNum(pay.amount))}</span>{" "}
              (<span className="font-semibold tabular-nums">{phpExact(pay.amount)}</span>) as payment for{" "}
              <span className="font-semibold">{b.description}</span>
              {project?.name && <> — {project.name}</>}.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-muted">Paid by</dt>
              <dd>
                {labelOf(PAYMENT_METHODS, pay.method)}
                {pay.reference && ` · ${pay.reference}`}
              </dd>
              <dt className="text-muted">Billing amount</dt>
              <dd className="tabular-nums">{phpExact(b.amount)}</dd>
              <dt className="text-muted">Balance after payments to date</dt>
              <dd className="tabular-nums">{phpExact(b.balance)}</dd>
            </dl>
          </div>
          <p className="text-xs text-muted">This acknowledgment receipt is not a BIR-registered official receipt.</p>
          <SignatureLines labels={["Received by", "Date"]} />
        </DocumentCard>
      </div>
    </>
  );
}
