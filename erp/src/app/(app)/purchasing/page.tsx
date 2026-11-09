import Link from "next/link";
import type { Metadata } from "next";
import { addSupplier, deleteSupplier, updateSupplier } from "@/app/actions/purchasing";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PoList } from "@/components/purchasing";
import { AddPanel } from "@/components/records";
import { Card, CardHeader, EmptyState, Field, Input, LinkButton, PageHeader, Stat, Textarea, cx } from "@/components/ui";
import { php } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { PurchaseOrderSummary, Supplier } from "@/lib/types";

export const metadata: Metadata = { title: "Purchasing" };

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "unpaid", label: "Received, unpaid" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
];

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; show?: string; edit?: string }>;
}) {
  const { view = "orders", show = "open", edit } = await searchParams;
  const { supabase, orgId, isOwner } = await getSession();

  const [{ data: poRows }, { data: supplierRows }, { data: projectRows }] = await Promise.all([
    supabase.from("purchase_order_summary").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("suppliers").select("*").eq("org_id", orgId).order("name"),
    supabase.from("projects").select("id, name").eq("org_id", orgId),
  ]);
  const pos = (poRows ?? []) as PurchaseOrderSummary[];
  const suppliers = (supplierRows ?? []) as Supplier[];
  const projectNames = new Map((projectRows ?? []).map((p) => [p.id as string, p.name as string]));

  const unpaid = pos.filter((p) => !p.expense_id && (p.status === "ordered" || p.status === "received"));
  const payables = unpaid.filter((p) => p.status === "received");
  const sum = (l: PurchaseOrderSummary[]) => l.reduce((s, p) => s + Number(p.total), 0);

  const shown =
    show === "unpaid"
      ? payables
      : show === "paid"
        ? pos.filter((p) => p.expense_id)
        : show === "all"
          ? pos
          : pos.filter((p) => !p.expense_id && p.status !== "cancelled");

  const bySupplier = new Map<string, { count: number; unpaid: number }>();
  for (const p of pos) {
    const s = bySupplier.get(p.supplier_id) ?? { count: 0, unpaid: 0 };
    s.count++;
    if (!p.expense_id && p.status === "received") s.unpaid += Number(p.total);
    bySupplier.set(p.supplier_id, s);
  }

  return (
    <>
      <PageHeader
        title="Purchasing"
        sub="Purchase orders to suppliers. A PO becomes a project cost when you pay it."
        actions={<LinkButton href="/purchasing/new">+ New PO</LinkButton>}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Committed" value={php(sum(unpaid))} sub={`${unpaid.length} open POs, not yet paid`} />
        <Stat
          label="To pay suppliers"
          value={php(sum(payables))}
          tone={payables.length ? "warn" : undefined}
          sub={payables.length ? `${payables.length} delivered, unpaid` : "Nothing delivered unpaid"}
        />
        <Stat label="Suppliers" value={String(suppliers.length)} sub={`${pos.length} POs all-time`} />
      </div>

      <div className="mb-3 flex gap-1 border-b border-line">
        {[
          { id: "orders", label: "Purchase orders", href: "/purchasing" },
          { id: "suppliers", label: "Suppliers", href: "/purchasing?view=suppliers" },
        ].map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={cx(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium",
              view === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {view === "suppliers" ? (
        <Card>
          <CardHeader title="Suppliers" sub={`${suppliers.length} suppliers`} />
          <AddPanel label="Add a supplier" defaultOpen={suppliers.length === 0}>
            <ActionForm action={addSupplier}>
              <SupplierFields />
              <div className="mt-4 flex justify-end">
                <SubmitButton>Add supplier</SubmitButton>
              </div>
            </ActionForm>
          </AddPanel>
          {suppliers.length === 0 ? (
            <EmptyState title="No suppliers yet">Add the hardware stores, batching plants and subcontractors you buy from.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {suppliers.map((s) =>
                edit === s.id ? (
                  <li key={s.id} className="bg-canvas/60 px-4 py-4 sm:px-5">
                    <ActionForm action={updateSupplier.bind(null, s.id)} resetOnSuccess={false}>
                      <SupplierFields supplier={s} />
                      <div className="mt-4 flex justify-end gap-2">
                        <LinkButton href="/purchasing?view=suppliers" variant="secondary">
                          Cancel
                        </LinkButton>
                        <SubmitButton>Save</SubmitButton>
                      </div>
                    </ActionForm>
                  </li>
                ) : (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-muted">
                        {[s.contact_person, s.phone, s.email, s.tin && `TIN ${s.tin}`].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                      {s.address && <p className="text-xs text-muted">{s.address}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-right text-xs text-muted">
                        {bySupplier.get(s.id)?.count ?? 0} POs
                        {(bySupplier.get(s.id)?.unpaid ?? 0) > 0 && (
                          <span className="block font-medium text-warn">{php(bySupplier.get(s.id)!.unpaid)} to pay</span>
                        )}
                      </span>
                      <Link href={`/purchasing?view=suppliers&edit=${s.id}`} className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
                        Edit
                      </Link>
                      {isOwner && !bySupplier.has(s.id) && (
                        <ActionForm action={deleteSupplier.bind(null, s.id)} resetOnSuccess={false}>
                          <button className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-loss-soft hover:text-loss">Delete</button>
                        </ActionForm>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line px-4 py-2.5 sm:px-5">
            {FILTERS.map((f) => (
              <Link
                key={f.value}
                href={f.value === "open" ? "/purchasing" : `/purchasing?show=${f.value}`}
                className={cx(
                  "whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium",
                  show === f.value ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <PoList pos={shown} projectNames={projectNames} />
        </Card>
      )}
    </>
  );
}

function SupplierFields({ supplier }: { supplier?: Supplier }) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label="Name" className="sm:col-span-3">
        <Input name="name" defaultValue={supplier?.name} placeholder="Laguna Hollow Blocks" required />
      </Field>
      <Field label="Contact person" className="sm:col-span-3">
        <Input name="contact_person" defaultValue={supplier?.contact_person ?? ""} />
      </Field>
      <Field label="Phone" className="sm:col-span-2">
        <Input name="phone" defaultValue={supplier?.phone ?? ""} placeholder="0917 123 4567" />
      </Field>
      <Field label="Email" className="sm:col-span-2">
        <Input name="email" type="email" defaultValue={supplier?.email ?? ""} />
      </Field>
      <Field label="TIN" className="sm:col-span-2">
        <Input name="tin" defaultValue={supplier?.tin ?? ""} placeholder="000-000-000-000" />
      </Field>
      <Field label="Address" className="sm:col-span-6">
        <Input name="address" defaultValue={supplier?.address ?? ""} />
      </Field>
      <Field label="Notes" className="sm:col-span-6">
        <Textarea name="notes" rows={2} defaultValue={supplier?.notes ?? ""} />
      </Field>
    </div>
  );
}
