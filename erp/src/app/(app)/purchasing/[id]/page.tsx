import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deletePurchaseOrder, payPurchaseOrder, setPoStatus, unpayPurchaseOrder } from "@/app/actions/purchasing";
import { PoStatusBadge } from "@/components/badges";
import { PrintButton } from "@/components/print-button";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, CardHeader, Field, Input, LinkButton, PageHeader } from "@/components/ui";
import { EXPENSE_CATEGORIES, labelOf } from "@/lib/constants";
import { fmtDate, php, phpExact, todayISO } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { PurchaseOrderItem, PurchaseOrderSummary, Supplier } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("purchase_orders").select("po_number").eq("id", id).maybeSingle();
  return { title: data?.po_number ?? "Purchase order" };
}

const qtyFmt = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 3 });

export default async function PoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, orgName, isOwner } = await getSession();

  const { data: row } = await supabase.from("purchase_order_summary").select("*").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!row) notFound();
  const po = row as PurchaseOrderSummary;

  const [{ data: itemRows }, { data: supplier }, { data: project }, { data: boq }] = await Promise.all([
    supabase.from("purchase_order_items").select("*").eq("purchase_order_id", id).order("sort_order"),
    supabase.from("suppliers").select("*").eq("id", po.supplier_id).maybeSingle(),
    supabase.from("projects").select("id, name, location, client_name").eq("id", po.project_id).maybeSingle(),
    po.boq_item_id ? supabase.from("boq_items").select("item_no, description").eq("id", po.boq_item_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const items = (itemRows ?? []) as PurchaseOrderItem[];
  const s = supplier as Supplier | null;
  const paid = Boolean(po.expense_id);
  const payable = !paid && (po.status === "ordered" || po.status === "received");

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          back={{ href: `/projects/${po.project_id}?tab=purchases`, label: project?.name ?? "Project" }}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {po.po_number} <PoStatusBadge status={po.status} paid={paid} />
            </span>
          }
          sub={`${po.supplier_name} · ${php(po.total)}`}
          actions={
            <>
              <PrintButton />
              {!paid && (
                <LinkButton href={`/purchasing/${id}/edit`} variant="secondary">
                  Edit
                </LinkButton>
              )}
            </>
          }
        />

        <Card className="mb-4">
          <CardHeader
            title={paid ? `Paid ${fmtDate(po.paid_date)}` : "Status"}
            sub={
              paid
                ? `Recorded as a ${labelOf(EXPENSE_CATEGORIES, po.category).toLowerCase()} cost on ${project?.name}.`
                : po.status === "draft"
                  ? "Drafts don’t count as committed cost until ordered."
                  : po.status === "cancelled"
                    ? "Cancelled — not counted anywhere."
                    : "Counted as committed cost on the project until paid."
            }
          />
          <div className="flex flex-wrap items-end gap-3 p-4 sm:p-5">
            {po.status === "draft" && (
              <form action={setPoStatus.bind(null, id, "ordered")}>
                <SubmitButton>Mark as ordered</SubmitButton>
              </form>
            )}
            {po.status === "ordered" && (
              <form action={setPoStatus.bind(null, id, "received")}>
                <SubmitButton variant="secondary">Mark delivered</SubmitButton>
              </form>
            )}
            {payable && (
              <ActionForm action={payPurchaseOrder.bind(null, id)} className="flex flex-wrap items-end gap-2" resetOnSuccess={false}>
                <Field label="Date paid">
                  <Input name="paid_date" type="date" defaultValue={todayISO()} className="w-40" />
                </Field>
                <SubmitButton>Mark paid · record {php(po.total)} cost</SubmitButton>
              </ActionForm>
            )}
            {paid && isOwner && (
              <ActionForm action={unpayPurchaseOrder.bind(null, id)} resetOnSuccess={false}>
                <SubmitButton variant="secondary" pendingText="Undoing…">
                  Undo payment
                </SubmitButton>
              </ActionForm>
            )}
            {!paid && po.status !== "cancelled" && po.status !== "draft" && (
              <form action={setPoStatus.bind(null, id, "cancelled")}>
                <SubmitButton variant="ghost">Cancel PO</SubmitButton>
              </form>
            )}
            {po.status === "cancelled" && (
              <form action={setPoStatus.bind(null, id, "draft")}>
                <SubmitButton variant="secondary">Reopen as draft</SubmitButton>
              </form>
            )}
            {isOwner && !paid && (
              <ActionForm action={deletePurchaseOrder.bind(null, id)} className="ml-auto" resetOnSuccess={false}>
                <SubmitButton variant="danger" pendingText="Deleting…">
                  Delete PO
                </SubmitButton>
              </ActionForm>
            )}
          </div>
        </Card>
      </div>

      {/* The purchase order document — this is what prints. */}
      <Card className="p-5 sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-lg font-semibold text-ink">{orgName}</p>
            <p className="text-sm text-muted">Purchase order</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-sm">
            <dt className="text-muted">PO no.</dt>
            <dd className="font-semibold text-ink">{po.po_number}</dd>
            <dt className="text-muted">Date</dt>
            <dd className="text-ink">{fmtDate(po.order_date)}</dd>
            {po.expected_date && (
              <>
                <dt className="text-muted">Deliver by</dt>
                <dd className="text-ink">{fmtDate(po.expected_date)}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="grid gap-5 border-b border-line py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Supplier</p>
            <p className="mt-1 font-medium text-ink">{po.supplier_name}</p>
            {s && (
              <div className="text-sm text-muted">
                {s.contact_person && <p>Attn: {s.contact_person}</p>}
                {s.address && <p>{s.address}</p>}
                {(s.phone || s.email) && <p>{[s.phone, s.email].filter(Boolean).join(" · ")}</p>}
                {s.tin && <p>TIN {s.tin}</p>}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Deliver to</p>
            <p className="mt-1 font-medium text-ink">{project?.name}</p>
            <div className="text-sm text-muted">
              {project?.location && <p>{project.location}</p>}
              {boq && <p>BOQ: {[boq.item_no, boq.description].filter(Boolean).join(" ")}</p>}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="py-2.5 pr-3 text-left font-medium">#</th>
                <th className="py-2.5 pr-3 text-left font-medium">Description</th>
                <th className="py-2.5 pr-3 text-right font-medium">Qty</th>
                <th className="py-2.5 pr-3 text-left font-medium">Unit</th>
                <th className="py-2.5 pr-3 text-right font-medium">Unit price</th>
                <th className="py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i, n) => (
                <tr key={i.id}>
                  <td className="py-2.5 pr-3 text-muted">{n + 1}</td>
                  <td className="py-2.5 pr-3 text-ink">{i.description}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-ink">{qtyFmt.format(Number(i.quantity))}</td>
                  <td className="py-2.5 pr-3 text-muted">{i.unit}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-ink">{phpExact(i.unit_cost)}</td>
                  <td className="py-2.5 text-right tabular-nums text-ink">{phpExact(i.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink/20">
                <td colSpan={5} className="py-3 pr-3 text-right font-medium text-ink">
                  Total
                </td>
                <td className="py-3 text-right text-base font-semibold tabular-nums text-ink">{phpExact(po.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {po.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{po.notes}</p>
          </div>
        )}

        <div className="mt-12 grid gap-10 text-sm sm:grid-cols-2">
          {["Prepared by", "Approved by"].map((l) => (
            <div key={l}>
              <div className="h-8 border-b border-ink/40" />
              <p className="mt-1 text-muted">{l}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
