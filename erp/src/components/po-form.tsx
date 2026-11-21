"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { num, phpExact, todayISO } from "@/lib/format";
import type { ActionState, PurchaseOrderItem, PurchaseOrderSummary } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Card, Field, Input, LinkButton, Select, Textarea } from "./ui";

type Option = { id: string; label: string };
type Row = { key: number; description: string; unit: string; qty: string; cost: string };

let nextKey = 1;
const blankRow = (): Row => ({ key: nextKey++, description: "", unit: "", qty: "", cost: "" });

export function PurchaseOrderForm({
  action,
  projects,
  suppliers,
  boqByProject,
  po,
  items,
  defaultProjectId,
  cancelHref,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  projects: Option[];
  suppliers: Option[];
  boqByProject: Record<string, Option[]>;
  /** Editing an existing PO. */
  po?: PurchaseOrderSummary;
  items?: PurchaseOrderItem[];
  defaultProjectId?: string;
  cancelHref: string;
}) {
  const [projectId, setProjectId] = useState(po?.project_id ?? defaultProjectId ?? "");
  const [supplierId, setSupplierId] = useState(po?.supplier_id ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    items?.length
      ? items.map((i) => ({
          key: nextKey++,
          description: i.description,
          unit: i.unit ?? "",
          qty: String(Number(i.quantity)),
          cost: String(Number(i.unit_cost)),
        }))
      : [blankRow(), blankRow(), blankRow()],
  );

  const lineTotal = (r: Row) => {
    const q = num(r.qty, 3);
    const c = num(r.cost);
    return Number.isFinite(q) && Number.isFinite(c) ? Math.round(q * c * 100) / 100 : 0;
  };
  const total = rows.reduce((s, r) => s + lineTotal(r), 0);
  const boq = boqByProject[projectId] ?? [];
  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <Card className="p-5 sm:p-6">
      <ActionForm action={action} resetOnSuccess={false}>
        <div className="grid gap-4 sm:grid-cols-2">
          {po ? (
            <Field label="Project">
              <Input value={projects.find((p) => p.id === po.project_id)?.label ?? ""} readOnly className="bg-canvas text-muted" />
            </Field>
          ) : (
            <Field label="Project">
              <Select name="project_id" required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="" disabled>
                  Choose a project…
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Supplier">
            <Select name="supplier_id" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">{po ? "Choose a supplier…" : "New supplier…"}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {!po && !supplierId && (
            <Field label="New supplier’s name" hint="Added to your supplier list." className="sm:col-span-2">
              <Input name="new_supplier" placeholder="Laguna Hollow Blocks" required />
            </Field>
          )}
          <Field label="Cost category">
            <Select name="category" defaultValue={po?.category ?? "materials"}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="BOQ line" hint={boq.length ? undefined : "This project has no BOQ yet."}>
            <Select name="boq_item_id" defaultValue={po?.boq_item_id ?? ""} key={projectId} disabled={boq.length === 0}>
              <option value="">Not assigned</option>
              {boq.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Order date">
            <Input name="order_date" type="date" defaultValue={po?.order_date ?? todayISO()} />
          </Field>
          <Field label="Expected delivery">
            <Input name="expected_date" type="date" defaultValue={po?.expected_date ?? ""} />
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-ink">Items</p>
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_5rem_6rem_8rem_7rem_2rem] gap-2 text-xs text-muted sm:grid">
              <span>Description</span>
              <span>Unit</span>
              <span>Qty</span>
              <span>Unit price (₱)</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            {rows.map((r, idx) => (
              <div
                key={r.key}
                className="grid grid-cols-[1fr_1fr_1fr] gap-2 rounded-lg border border-line p-2 sm:grid-cols-[1fr_5rem_6rem_8rem_7rem_2rem] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
              >
                <Input
                  name="item_description"
                  aria-label={`Item ${idx + 1} description`}
                  placeholder={idx === 0 ? "Portland cement, 40kg" : ""}
                  value={r.description}
                  onChange={(e) => update(r.key, { description: e.target.value })}
                  className="col-span-3 sm:col-span-1"
                />
                <Input name="item_unit" aria-label="Unit" placeholder="bag" value={r.unit} onChange={(e) => update(r.key, { unit: e.target.value })} />
                <Input name="item_qty" aria-label="Quantity" inputMode="decimal" placeholder="0" value={r.qty} onChange={(e) => update(r.key, { qty: e.target.value })} />
                <Input name="item_cost" aria-label="Unit price" inputMode="decimal" placeholder="0.00" value={r.cost} onChange={(e) => update(r.key, { cost: e.target.value })} />
                <span className="col-span-2 self-center text-sm tabular-nums text-ink sm:col-span-1 sm:text-right">{phpExact(lineTotal(r))}</span>
                <button
                  type="button"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [blankRow()]))}
                  className="justify-self-end rounded-md px-2 py-1 text-xs text-muted hover:bg-loss-soft hover:text-loss"
                  aria-label={`Remove item ${idx + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setRows((rs) => [...rs, blankRow()])} className="text-sm font-medium text-brand hover:underline">
              + Add a line
            </button>
            <p className="text-sm text-muted">
              Total <span className="ml-2 text-base font-semibold tabular-nums text-ink">{phpExact(total)}</span>
            </p>
          </div>
        </div>

        <Field label="Notes" className="mt-6">
          <Textarea name="notes" rows={2} defaultValue={po?.notes ?? ""} placeholder="Deliver to site, Mon–Sat 8am–5pm" />
        </Field>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <LinkButton href={cancelHref} variant="secondary">
            Cancel
          </LinkButton>
          {!po && (
            <button type="submit" name="status" value="draft" className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas">
              Save as draft
            </button>
          )}
          <SubmitButton>{po ? "Save changes" : "Create PO"}</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}
