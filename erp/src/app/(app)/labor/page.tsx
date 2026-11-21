import Link from "next/link";
import type { Metadata } from "next";
import { addWorker, setWorkerActive, updateWorker } from "@/app/actions/labor";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AddPanel } from "@/components/records";
import { Badge, Card, CardHeader, EmptyState, Field, Input, LinkButton, PageHeader, Stat, cx } from "@/components/ui";
import { fmtDate, php, toNum } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { PayrollRun, Worker } from "@/lib/types";

export const metadata: Metadata = { title: "Labor" };

export default async function LaborPage({ searchParams }: { searchParams: Promise<{ view?: string; edit?: string }> }) {
  const { view = "workers", edit } = await searchParams;
  const { supabase, orgId } = await getSession();

  const [{ data: workerRows }, { data: runRows }, { data: projectRows }] = await Promise.all([
    supabase.from("workers").select("*").eq("org_id", orgId).order("active", { ascending: false }).order("name"),
    supabase.from("payroll_runs").select("*").eq("org_id", orgId).order("period_end", { ascending: false }).limit(100),
    supabase.from("project_summary").select("id, name, unpaid_labor").eq("org_id", orgId),
  ]);
  const workers = (workerRows ?? []) as Worker[];
  const runs = (runRows ?? []) as PayrollRun[];
  const projects = projectRows ?? [];
  const projectNames = new Map(projects.map((p) => [p.id as string, p.name as string]));
  const unpaid = projects.filter((p) => toNum(p.unpaid_labor) > 0);
  const unpaidTotal = unpaid.reduce((s, p) => s + toNum(p.unpaid_labor), 0);
  const active = workers.filter((w) => w.active);

  return (
    <>
      <PageHeader
        title="Labor"
        sub="Your crew, daily rates and payroll. Log attendance on each project’s Site log tab."
        actions={<LinkButton href="/labor/payroll/new">Run payroll</LinkButton>}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Active workers" value={String(active.length)} sub={`${workers.length - active.length} inactive`} />
        <Stat
          label="Logged, not yet paid"
          value={php(unpaidTotal)}
          tone={unpaidTotal > 0 ? "warn" : undefined}
          sub={unpaid.length ? unpaid.map((p) => p.name).join(", ") : "Nothing waiting for payroll"}
        />
        <Stat label="Payroll recorded" value={php(runs.reduce((s, r) => s + toNum(r.total), 0))} sub={`${runs.length} payroll runs`} />
      </div>

      <div className="mb-3 flex gap-1 border-b border-line">
        {[
          { id: "workers", label: "Workers", href: "/labor" },
          { id: "payroll", label: "Payroll", href: "/labor?view=payroll" },
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

      {view === "payroll" ? (
        <Card>
          <CardHeader title="Payroll runs" sub="Each run pays one project’s site log for a period and records it as a labor cost." />
          {runs.length === 0 ? (
            <EmptyState title="No payroll yet">Log attendance on a project’s Site log tab, then run payroll for the week.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {runs.map((r) => (
                <li key={r.id}>
                  <Link href={`/labor/payroll/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas/50 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{projectNames.get(r.project_id) ?? "Project"}</p>
                      <p className="text-xs text-muted">
                        {fmtDate(r.period_start)} – {fmtDate(r.period_end)} · {r.worker_count} workers
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink">{php(r.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader title="Workers" sub="Daily rate is copied onto each day logged, so a raise only affects days after it." />
          <AddPanel label="Add a worker" defaultOpen={workers.length === 0}>
            <ActionForm action={addWorker}>
              <WorkerFields />
              <div className="mt-4 flex justify-end">
                <SubmitButton>Add worker</SubmitButton>
              </div>
            </ActionForm>
          </AddPanel>
          {workers.length === 0 ? (
            <EmptyState title="No workers yet">Add masons, carpenters, helpers and their daily rates.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {workers.map((w) =>
                edit === w.id ? (
                  <li key={w.id} className="bg-canvas/60 px-4 py-4 sm:px-5">
                    <ActionForm action={updateWorker.bind(null, w.id)} resetOnSuccess={false}>
                      <WorkerFields worker={w} />
                      <div className="mt-4 flex justify-end gap-2">
                        <LinkButton href="/labor" variant="secondary">
                          Cancel
                        </LinkButton>
                        <SubmitButton>Save</SubmitButton>
                      </div>
                    </ActionForm>
                  </li>
                ) : (
                  <li key={w.id} className={cx("flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5", !w.active && "opacity-60")}>
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {w.name} {!w.active && <Badge>Inactive</Badge>}
                      </p>
                      <p className="text-xs text-muted">{[w.position, w.phone].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums text-ink">{php(w.daily_rate)}/day</span>
                      <Link href={`/labor?edit=${w.id}`} className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
                        Edit
                      </Link>
                      <form action={setWorkerActive.bind(null, w.id, !w.active)}>
                        <button className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
                          {w.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}

function WorkerFields({ worker }: { worker?: Worker }) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label="Name" className="sm:col-span-2">
        <Input name="name" defaultValue={worker?.name} placeholder="Juan Santos" required />
      </Field>
      <Field label="Position" className="sm:col-span-2">
        <Input name="position" defaultValue={worker?.position ?? ""} placeholder="Mason" />
      </Field>
      <Field label="Daily rate (₱)">
        <Input name="daily_rate" inputMode="decimal" defaultValue={worker ? String(worker.daily_rate) : ""} placeholder="750" required />
      </Field>
      <Field label="Phone">
        <Input name="phone" defaultValue={worker?.phone ?? ""} placeholder="0917…" />
      </Field>
    </div>
  );
}
