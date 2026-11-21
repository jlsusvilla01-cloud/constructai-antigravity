import Link from "next/link";
import { addBoqItem, applyBoqAsBudget, deleteBoqItem, importBoq, updateBoqItem } from "@/app/actions/boq";
import { EXPENSE_CATEGORIES, labelOf } from "@/lib/constants";
import { php, phpExact } from "@/lib/format";
import type { ActionState, BoqItem } from "@/lib/types";
import { ActionForm, DeleteButton, SubmitButton } from "./forms";
import { AddPanel } from "./records";
import { Card, CardHeader, EmptyState, Field, Input, LinkButton, Meter, Select, Textarea, cx } from "./ui";

const th = "px-3 py-2.5 text-left text-xs font-medium text-muted first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5";
const td = "px-3 py-3 align-top first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5";
const qtyFmt = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 3 });

function BoqFields({ item }: { item?: BoqItem }) {
  return (
    <div className="grid gap-3 sm:grid-cols-12">
      <Field label="Item no." className="sm:col-span-2">
        <Input name="item_no" defaultValue={item?.item_no ?? ""} placeholder="3.01" />
      </Field>
      <Field label="Description" className="sm:col-span-6">
        <Input name="description" defaultValue={item?.description} placeholder="Concrete works, 4000 psi" required />
      </Field>
      <Field label="Category" className="sm:col-span-4">
        <Select name="category" defaultValue={item?.category ?? "materials"}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quantity" className="sm:col-span-3">
        <Input name="quantity" inputMode="decimal" defaultValue={item ? String(item.quantity) : ""} placeholder="45" />
      </Field>
      <Field label="Unit" className="sm:col-span-3">
        <Input name="unit" defaultValue={item?.unit ?? ""} placeholder="cu.m" />
      </Field>
      <Field label="Unit cost (₱)" className="sm:col-span-3">
        <Input name="unit_cost" inputMode="decimal" defaultValue={item ? String(item.unit_cost) : ""} placeholder="6,800" required />
      </Field>
    </div>
  );
}

export function BoqPanel({
  projectId,
  items,
  actualByItem,
  committedByItem,
  unassigned,
  budget,
  editId,
}: {
  projectId: string;
  items: BoqItem[];
  /** Costs recorded against each BOQ line. */
  actualByItem: Map<string, number>;
  /** Open purchase orders charged to each BOQ line. */
  committedByItem: Map<string, number>;
  /** Project costs not assigned to any BOQ line. */
  unassigned: number;
  budget: number;
  editId?: string;
}) {
  const total = items.reduce((s, i) => s + Number(i.amount), 0);
  const actual = items.reduce((s, i) => s + (actualByItem.get(i.id) ?? 0), 0);
  const committed = items.reduce((s, i) => s + (committedByItem.get(i.id) ?? 0), 0);
  const base = `/projects/${projectId}?tab=boq`;

  return (
    <Card>
      <CardHeader
        title="Bill of quantities"
        sub={
          items.length
            ? `${items.length} items · ${php(total)} estimated cost${budget !== total ? ` · cost budget is ${php(budget)}` : ""}`
            : "Break the job into line items to set the budget and track cost per line."
        }
        action={
          items.length > 0 && Math.abs(budget - total) >= 0.01 ? (
            <form action={applyBoqAsBudget.bind(null, projectId)}>
              <button className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas">
                Use as cost budget
              </button>
            </form>
          ) : undefined
        }
      />
      <AddPanel label="Add an item" defaultOpen={items.length === 0}>
        <ActionForm action={addBoqItem.bind(null, projectId)}>
          <BoqFields />
          <div className="mt-4 flex justify-end">
            <SubmitButton>Add item</SubmitButton>
          </div>
        </ActionForm>
      </AddPanel>
      <AddPanel label="Paste from Excel">
        <ActionForm action={importBoq.bind(null, projectId)}>
          <Field
            label="Rows copied from Excel or Google Sheets"
            hint="Columns in this order: Item no. · Description · Unit · Qty · Unit cost · Category (optional). Header rows are skipped."
          >
            <Textarea name="lines" rows={6} className="font-mono text-xs" placeholder={"1.01\tMobilization\tlot\t1\t35000\n3.01\tConcrete 4000 psi\tcu.m\t45\t6800"} required />
          </Field>
          <div className="mt-4 flex justify-end">
            <SubmitButton pendingText="Importing…">Import items</SubmitButton>
          </div>
        </ActionForm>
      </AddPanel>

      {items.length === 0 ? (
        <EmptyState title="No BOQ items yet">Add items one by one, or paste them from your estimate spreadsheet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-line bg-canvas/60">
              <tr>
                <th className={th}>Item</th>
                <th className={cx(th, "text-right")}>Qty</th>
                <th className={cx(th, "text-right")}>Unit cost</th>
                <th className={cx(th, "text-right")}>Budget</th>
                <th className={cx(th, "w-44")}>Actual + committed</th>
                <th className={cx(th, "text-right")}>Remaining</th>
                <th className={cx(th, "w-28")} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => {
                const a = actualByItem.get(i.id) ?? 0;
                const c = committedByItem.get(i.id) ?? 0;
                const amount = Number(i.amount);
                const used = amount > 0 ? ((a + c) / amount) * 100 : a + c > 0 ? 101 : 0;
                const left = amount - a - c;
                if (editId === i.id) {
                  return (
                    <tr key={i.id} className="bg-canvas/60">
                      <td colSpan={7} className="px-4 py-4 sm:px-5">
                        <EditBoqForm item={i} action={updateBoqItem.bind(null, i.id)} cancelHref={base} />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={i.id} className="hover:bg-canvas/50">
                    <td className={td}>
                      <p className="font-medium text-ink">
                        {i.item_no && <span className="mr-1.5 text-muted">{i.item_no}</span>}
                        {i.description}
                      </p>
                      <p className="text-xs text-muted">{labelOf(EXPENSE_CATEGORIES, i.category)}</p>
                    </td>
                    <td className={cx(td, "whitespace-nowrap text-right tabular-nums text-muted")}>
                      {qtyFmt.format(Number(i.quantity))} {i.unit}
                    </td>
                    <td className={cx(td, "whitespace-nowrap text-right tabular-nums text-muted")}>{phpExact(i.unit_cost)}</td>
                    <td className={cx(td, "whitespace-nowrap text-right font-medium tabular-nums text-ink")}>{php(amount)}</td>
                    <td className={td}>
                      <div className="mb-1 flex justify-between gap-2 text-xs tabular-nums text-muted">
                        <span>{php(a)}</span>
                        {c > 0 && <span className="text-warn">+{php(c)} PO</span>}
                      </div>
                      <Meter value={used} />
                    </td>
                    <td className={cx(td, "whitespace-nowrap text-right tabular-nums", left < 0 ? "font-medium text-loss" : "text-ink")}>
                      {php(left)}
                    </td>
                    <td className={cx(td, "text-right")}>
                      <div className="flex justify-end gap-1">
                        <Link href={`${base}&edit=${i.id}`} scroll={false} className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
                          Edit
                        </Link>
                        <DeleteButton action={deleteBoqItem.bind(null, i.id)} confirmText="Delete this BOQ item? Costs charged to it stay, unassigned." />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-line bg-canvas/60 text-sm">
              <tr>
                <td className={cx(td, "font-medium text-ink")} colSpan={3}>
                  Total
                </td>
                <td className={cx(td, "text-right font-semibold tabular-nums text-ink")}>{php(total)}</td>
                <td className={cx(td, "tabular-nums text-muted")}>
                  {php(actual)}
                  {committed > 0 && <span className="text-warn"> +{php(committed)} PO</span>}
                </td>
                <td className={cx(td, "text-right font-semibold tabular-nums", total - actual - committed < 0 ? "text-loss" : "text-ink")}>
                  {php(total - actual - committed)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {unassigned > 0 && items.length > 0 && (
        <p className="border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
          {php(unassigned)} of costs on this project aren’t charged to a BOQ line.{" "}
          <Link href={`/projects/${projectId}?tab=costs`} className="font-medium text-brand hover:underline">
            View costs
          </Link>
        </p>
      )}
    </Card>
  );
}

function EditBoqForm({
  item,
  action,
  cancelHref,
}: {
  item: BoqItem;
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} resetOnSuccess={false}>
      <BoqFields item={item} />
      <div className="mt-4 flex justify-end gap-2">
        <LinkButton href={cancelHref} variant="secondary" scroll={false}>
          Cancel
        </LinkButton>
        <SubmitButton>Save item</SubmitButton>
      </div>
    </ActionForm>
  );
}
