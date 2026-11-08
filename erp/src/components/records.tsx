import Link from "next/link";
import {
  addBilling,
  addChangeOrder,
  addExpense,
  addPayment,
  deleteBilling,
  deleteChangeOrder,
  deleteExpense,
  deletePayment,
  setChangeOrderStatus,
} from "@/app/actions/data";
import { EXPENSE_CATEGORIES, labelOf, PAYMENT_METHODS } from "@/lib/constants";
import { fmtDate, php, todayISO } from "@/lib/format";
import type { BillingSummary, ChangeOrder, Expense, Payment } from "@/lib/types";
import { BillingStatusBadge } from "./badges";
import { ActionForm, DeleteButton, SubmitButton } from "./forms";
import { Badge, EmptyState, Field, Input, Select, cx } from "./ui";

type ProjectOption = { id: string; name: string };

/** Collapsible "Add …" panel built on <details>, so it works without client JS. */
export function AddPanel({ label, children, defaultOpen }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-line" open={defaultOpen}>
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-brand hover:bg-brand-soft/50 sm:px-5">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-brand text-white transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
        {label}
      </summary>
      <div className="px-4 pb-5 pt-1 sm:px-5">{children}</div>
    </details>
  );
}

const th = "px-4 py-2.5 text-left text-xs font-medium text-muted sm:px-5";
const td = "px-4 py-3 align-top sm:px-5";

// ─── Expenses ────────────────────────────────────────────────────────────────

export function ExpenseForm({ projects, projectId }: { projects?: ProjectOption[]; projectId?: string }) {
  return (
    <ActionForm action={addExpense}>
      <div className="grid gap-3 sm:grid-cols-6">
        {projectId ? (
          <input type="hidden" name="project_id" value={projectId} />
        ) : (
          <Field label="Project" className="sm:col-span-3">
            <Select name="project_id" defaultValue="">
              <option value="">Company overhead (no project)</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Category" className={projectId ? "sm:col-span-2" : "sm:col-span-3"}>
          <Select name="category" defaultValue={projectId ? "materials" : "overhead"}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What was it for?" className={projectId ? "sm:col-span-4" : "sm:col-span-6"}>
          <Input name="description" placeholder="Cement, 200 bags" required />
        </Field>
        <Field label="Paid to" className="sm:col-span-2">
          <Input name="payee" placeholder="Supplier or worker" />
        </Field>
        <Field label="Amount (₱)" className="sm:col-span-2">
          <Input name="amount" inputMode="decimal" placeholder="57,000" required />
        </Field>
        <Field label="Date" className="sm:col-span-2">
          <Input name="date" type="date" defaultValue={todayISO()} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <SubmitButton>Add cost</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ExpenseTable({
  expenses,
  projectNames,
}: {
  expenses: Expense[];
  /** When given, shows a Project column (for the company-wide list). */
  projectNames?: Map<string, string>;
}) {
  if (expenses.length === 0) return <EmptyState title="No costs recorded yet">Add materials, labor and other costs as you spend.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-canvas/60">
          <tr>
            <th className={th}>Date</th>
            <th className={th}>Description</th>
            {projectNames && <th className={th}>Project</th>}
            <th className={th}>Category</th>
            <th className={cx(th, "text-right")}>Amount</th>
            <th className="w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:bg-canvas/50">
              <td className={cx(td, "whitespace-nowrap text-muted")}>{fmtDate(e.date)}</td>
              <td className={td}>
                <p className="font-medium text-ink">{e.description}</p>
                {e.payee && <p className="text-xs text-muted">{e.payee}</p>}
              </td>
              {projectNames && (
                <td className={cx(td, "text-muted")}>
                  {e.project_id ? (
                    <Link href={`/projects/${e.project_id}`} className="hover:text-brand hover:underline">
                      {projectNames.get(e.project_id) ?? "—"}
                    </Link>
                  ) : (
                    <span className="italic">Overhead</span>
                  )}
                </td>
              )}
              <td className={td}>
                <Badge>{labelOf(EXPENSE_CATEGORIES, e.category)}</Badge>
              </td>
              <td className={cx(td, "whitespace-nowrap text-right font-medium tabular-nums text-ink")}>{php(e.amount)}</td>
              <td className={cx(td, "text-right")}>
                <DeleteButton action={deleteExpense.bind(null, e.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Change orders ───────────────────────────────────────────────────────────

export function ChangeOrderForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={addChangeOrder.bind(null, projectId)}>
      <div className="grid gap-3 sm:grid-cols-6">
        <Field label="Change" className="sm:col-span-6">
          <Input name="description" placeholder="Upgrade roofing to GA26" required />
        </Field>
        <Field label="Amount (₱)" hint="Use a minus sign for deductions." className="sm:col-span-2">
          <Input name="amount" inputMode="decimal" placeholder="42,000" required />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <Select name="status" defaultValue="pending">
            <option value="pending">Pending client approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </Field>
        <Field label="Date" className="sm:col-span-2">
          <Input name="date" type="date" defaultValue={todayISO()} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <SubmitButton>Add change order</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ChangeOrderTable({ items }: { items: ChangeOrder[] }) {
  if (items.length === 0)
    return <EmptyState title="No change orders">Approved change orders are added to the contract amount.</EmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="border-b border-line bg-canvas/60">
          <tr>
            <th className={th}>Date</th>
            <th className={th}>Change</th>
            <th className={th}>Status</th>
            <th className={cx(th, "text-right")}>Amount</th>
            <th className="w-40" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-canvas/50">
              <td className={cx(td, "whitespace-nowrap text-muted")}>{fmtDate(c.date)}</td>
              <td className={cx(td, "font-medium text-ink")}>{c.description}</td>
              <td className={td}>
                <Badge tone={c.status === "approved" ? "gain" : c.status === "rejected" ? "neutral" : "warn"}>
                  {c.status === "approved" ? "Approved" : c.status === "rejected" ? "Rejected" : "Pending"}
                </Badge>
              </td>
              <td className={cx(td, "whitespace-nowrap text-right font-medium tabular-nums text-ink", c.status === "rejected" && "text-faint line-through")}>
                {php(c.amount)}
              </td>
              <td className={cx(td, "text-right")}>
                <div className="flex justify-end gap-1">
                  {c.status === "pending" && (
                    <>
                      <form action={setChangeOrderStatus.bind(null, c.id, "approved")}>
                        <button className="rounded-md px-2 py-1 text-xs font-medium text-gain hover:bg-gain-soft">Approve</button>
                      </form>
                      <form action={setChangeOrderStatus.bind(null, c.id, "rejected")}>
                        <button className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas">Reject</button>
                      </form>
                    </>
                  )}
                  <DeleteButton action={deleteChangeOrder.bind(null, c.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Billings & payments ─────────────────────────────────────────────────────

export function BillingForm({ projects, projectId }: { projects?: ProjectOption[]; projectId?: string }) {
  return (
    <ActionForm action={addBilling}>
      <div className="grid gap-3 sm:grid-cols-6">
        {projectId ? (
          <input type="hidden" name="project_id" value={projectId} />
        ) : (
          <Field label="Project" className="sm:col-span-6">
            <Select name="project_id" required defaultValue="">
              <option value="" disabled>
                Choose a project…
              </option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Description" className="sm:col-span-4">
          <Input name="description" placeholder="Progress billing #2 — structural frame" required />
        </Field>
        <Field label="Reference no." className="sm:col-span-2">
          <Input name="reference" placeholder="PB-02" />
        </Field>
        <Field label="Amount (₱)" className="sm:col-span-2">
          <Input name="amount" inputMode="decimal" placeholder="850,000" required />
        </Field>
        <Field label="Billing date" className="sm:col-span-2">
          <Input name="billed_date" type="date" defaultValue={todayISO()} />
        </Field>
        <Field label="Due date" className="sm:col-span-2">
          <Input name="due_date" type="date" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <SubmitButton>Add billing</SubmitButton>
      </div>
    </ActionForm>
  );
}

function PaymentForm({ billing }: { billing: BillingSummary }) {
  return (
    <ActionForm action={addPayment.bind(null, billing.id)}>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Amount received (₱)">
          <Input name="amount" inputMode="decimal" defaultValue={String(billing.balance)} required />
        </Field>
        <Field label="Date received">
          <Input name="date" type="date" defaultValue={todayISO()} />
        </Field>
        <Field label="Method">
          <Select name="method" defaultValue="bank_transfer">
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reference">
          <Input name="reference" placeholder="Check / transaction no." />
        </Field>
      </div>
      <div className="mt-3 flex justify-end">
        <SubmitButton>Record payment</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function BillingList({
  billings,
  payments,
  projectNames,
}: {
  billings: BillingSummary[];
  payments: Payment[];
  projectNames?: Map<string, string>;
}) {
  if (billings.length === 0)
    return <EmptyState title="No billings yet">Add a billing each time you invoice the client.</EmptyState>;

  const byBilling = new Map<string, Payment[]>();
  for (const p of payments) byBilling.set(p.billing_id, [...(byBilling.get(p.billing_id) ?? []), p]);

  return (
    <ul className="divide-y divide-line">
      {billings.map((b) => {
        const paidPct = b.amount > 0 ? Math.min((Number(b.paid) / Number(b.amount)) * 100, 100) : 0;
        const list = byBilling.get(b.id) ?? [];
        return (
          <li key={b.id}>
            <details className="group">
              <summary className="grid cursor-pointer grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-canvas/50 sm:grid-cols-[1fr_auto_auto] sm:px-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {b.reference && <span className="mr-1.5 text-muted">{b.reference}</span>}
                    {b.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {projectNames && b.project_id && (
                      <>
                        <span className="text-ink">{projectNames.get(b.project_id)}</span> ·{" "}
                      </>
                    )}
                    Billed {fmtDate(b.billed_date)}
                    {b.due_date && <> · Due {fmtDate(b.due_date)}</>}
                  </p>
                </div>
                <div className="self-center sm:order-last">
                  <BillingStatusBadge status={b.status} />
                </div>
                <div className="col-span-2 sm:col-span-1 sm:text-right">
                  <p className="text-sm font-semibold tabular-nums text-ink">{php(b.amount)}</p>
                  <div className="mt-1 flex items-center gap-2 sm:justify-end">
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-gain" style={{ width: `${paidPct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted">
                      {Number(b.balance) > 0 ? `${php(b.balance)} left` : "Fully paid"}
                    </span>
                  </div>
                </div>
              </summary>

              <div className="space-y-4 bg-canvas/60 px-4 py-4 sm:px-5">
                {list.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">Payments received</p>
                    <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                      {list.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span className="text-muted">
                            {fmtDate(p.date)} · {labelOf(PAYMENT_METHODS, p.method)}
                            {p.reference && <> · {p.reference}</>}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-medium tabular-nums text-gain">{php(p.amount)}</span>
                            <DeleteButton action={deletePayment.bind(null, p.id)} label="Remove" confirmText="Remove this payment?" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {Number(b.balance) > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">Record a payment</p>
                    <PaymentForm billing={b} />
                  </div>
                )}
                <div className="flex justify-end">
                  <DeleteButton
                    action={deleteBilling.bind(null, b.id)}
                    label="Delete billing"
                    confirmText="Delete this billing and all its payments? This can’t be undone."
                  />
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
