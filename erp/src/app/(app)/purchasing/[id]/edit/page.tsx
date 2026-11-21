import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { updatePurchaseOrder } from "@/app/actions/purchasing";
import { PurchaseOrderForm } from "@/components/po-form";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/org";
import { loadPoFormOptions } from "@/lib/po-options";
import type { PurchaseOrderItem, PurchaseOrderSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Edit purchase order" };

export default async function EditPoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await getSession();
  const [{ data: po }, { data: items }, options] = await Promise.all([
    supabase.from("purchase_order_summary").select("*").eq("id", id).eq("org_id", orgId).maybeSingle(),
    supabase.from("purchase_order_items").select("*").eq("purchase_order_id", id).order("sort_order"),
    loadPoFormOptions(supabase, orgId),
  ]);
  if (!po) notFound();
  if (po.expense_id) redirect(`/purchasing/${id}`);

  return (
    <>
      <PageHeader back={{ href: `/purchasing/${id}`, label: po.po_number }} title={`Edit ${po.po_number}`} />
      <PurchaseOrderForm
        action={updatePurchaseOrder.bind(null, id)}
        {...options}
        po={po as PurchaseOrderSummary}
        items={(items ?? []) as PurchaseOrderItem[]}
        cancelHref={`/purchasing/${id}`}
      />
    </>
  );
}
