import type { Metadata } from "next";
import { createPurchaseOrder } from "@/app/actions/purchasing";
import { PurchaseOrderForm } from "@/components/po-form";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/org";
import { loadPoFormOptions } from "@/lib/po-options";

export const metadata: Metadata = { title: "New purchase order" };

export default async function NewPoPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  const { supabase, orgId } = await getSession();
  const options = await loadPoFormOptions(supabase, orgId);
  const back = project ? { href: `/projects/${project}?tab=purchases`, label: "Project" } : { href: "/purchasing", label: "Purchasing" };

  return (
    <>
      <PageHeader back={back} title="New purchase order" sub="The PO number is assigned when you save." />
      <PurchaseOrderForm
        action={createPurchaseOrder}
        {...options}
        defaultProjectId={options.projects.some((p) => p.id === project) ? project : undefined}
        cancelHref={back.href}
      />
    </>
  );
}
