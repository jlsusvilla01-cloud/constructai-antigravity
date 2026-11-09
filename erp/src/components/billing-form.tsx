"use client";

import { useState } from "react";
import { addBilling } from "@/app/actions/data";
import { computeProgressBilling, downpaymentDue } from "@/lib/billing";
import { php, phpExact, todayISO } from "@/lib/format";
import type { BillingKind } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Field, Input, Select, cx } from "./ui";

/** What the form needs to know about a project to work out a progress billing. */
export type BillingProject = {
  id: string;
  name: string;
  revisedContract: number;
  retentionPct: number;
  downpaymentPct: number;
  downpaymentBilled: number;
  downpaymentRecouped: number;
  prevGross: number;
  prevPct: number;
  retentionHeld: number;
};

const KINDS: { value: BillingKind; label: string }[] = [
  { value: "progress", label: "Progress billing (% complete)" },
  { value: "downpayment", label: "Downpayment" },
  { value: "retention_release", label: "Retention release" },
  { value: "other", label: "Other / fixed amount" },
];

export function BillingForm({ projects, fixedProjectId }: { projects: BillingProject[]; fixedProjectId?: string }) {
  const [projectId, setProjectId] = useState(fixedProjectId ?? "");
  const [kind, setKind] = useState<BillingKind>("progress");
  const [pct, setPct] = useState("");
  const p = projects.find((x) => x.id === projectId);

  const dpDue = p ? downpaymentDue(p.revisedContract, p.downpaymentPct, p.downpaymentBilled) : 0;
  const pctNum = Number(pct.replace(/[%\s,]/g, ""));
  const preview =
    p && kind === "progress" && pct.trim() !== ""
      ? computeProgressBilling({
          revisedContract: p.revisedContract,
          retentionPct: p.retentionPct,
          downpaymentBilled: p.downpaymentBilled,
          downpaymentRecouped: p.downpaymentRecouped,
          prevGross: p.prevGross,
          prevPct: p.prevPct,
          cumulativePct: pctNum,
        })
      : null;

  const defaultAmount = kind === "downpayment" ? dpDue : kind === "retention_release" ? (p?.retentionHeld ?? 0) : 0;

  return (
    <ActionForm
      action={addBilling}
      onSuccess={() => {
        setPct("");
        setKind("progress");
        if (!fixedProjectId) setProjectId("");
      }}
    >
      <div className="grid gap-3 sm:grid-cols-6">
        {fixedProjectId ? (
          <input type="hidden" name="project_id" value={fixedProjectId} />
        ) : (
          <Field label="Project" className="sm:col-span-3">
            <Select name="project_id" required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="" disabled>
                Choose a project…
              </option>
              {projects.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Type" className={fixedProjectId ? "sm:col-span-6" : "sm:col-span-3"}>
          <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value as BillingKind)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>

        {kind === "progress" ? (
          <>
            <Field
              label="Work accomplished to date (%)"
              hint={p ? `Last billing: ${p.prevPct}% complete.` : undefined}
              className="sm:col-span-2"
            >
              <Input
                name="percent_complete"
                inputMode="decimal"
                placeholder={p ? String(Math.min(p.prevPct + 20, 100)) : "35"}
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                required
              />
            </Field>
            <div className="sm:col-span-4">
              <ProgressPreview project={p} preview={preview} />
            </div>
          </>
        ) : (
          <Field
            label="Amount (₱)"
            hint={
              kind === "downpayment" && p
                ? p.downpaymentPct > 0
                  ? `${p.downpaymentPct}% of contract, less anything already billed.`
                  : "Set the downpayment % on the project to fill this in."
                : kind === "retention_release" && p
                  ? `${php(p.retentionHeld)} of retention is being held.`
                  : undefined
            }
            className="sm:col-span-2"
          >
            <Input
              key={`${kind}-${projectId}`}
              name="amount"
              inputMode="decimal"
              defaultValue={defaultAmount > 0 ? String(defaultAmount) : ""}
              placeholder="850,000"
              required
            />
          </Field>
        )}

        <Field label="Description" className="sm:col-span-4">
          <Input
            name="description"
            placeholder={
              kind === "progress"
                ? "Progress billing #2 (optional)"
                : kind === "downpayment"
                  ? "Downpayment (optional)"
                  : kind === "retention_release"
                    ? "Release of retention (optional)"
                    : "Additional works — gate"
            }
            required={kind === "other"}
          />
        </Field>
        <Field label="Reference no." className="sm:col-span-2">
          <Input name="reference" placeholder="PB-02" />
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

function ProgressPreview({
  project: p,
  preview,
}: {
  project?: BillingProject;
  preview: ReturnType<typeof computeProgressBilling> | null;
}) {
  if (!p) return <p className="pt-6 text-xs text-muted">Choose a project to see the computation.</p>;
  if (!preview) {
    return (
      <p className="pt-6 text-xs text-muted">
        Contract {php(p.revisedContract)} · retention {p.retentionPct}% ·{" "}
        {p.downpaymentBilled > 0 ? `${php(p.downpaymentBilled - p.downpaymentRecouped)} downpayment to recoup` : "no downpayment"}
      </p>
    );
  }
  if ("error" in preview) return <p className="pt-6 text-xs text-loss">{preview.error}</p>;

  const rows: [string, number, boolean?][] = [
    ["Work accomplished to date", preview.grossToDate],
    ["Less previous progress billings", -p.prevGross],
    ["This billing (gross)", preview.gross, true],
    [`Less retention (${p.retentionPct}%)`, -preview.retention],
    ["Less downpayment recoupment", -preview.recoupment],
  ];
  return (
    <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2 text-xs">
      {rows.map(([label, v, strong]) => (
        <div key={label} className={cx("flex justify-between gap-3 py-0.5", strong ? "font-medium text-ink" : "text-muted")}>
          <span>{label}</span>
          <span className="tabular-nums">{v < 0 ? `− ${php(-v)}` : php(v)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-3 border-t border-line pt-1.5 text-sm font-semibold text-ink">
        <span>Net amount due</span>
        <span className="tabular-nums">{phpExact(preview.net)}</span>
      </div>
    </div>
  );
}
