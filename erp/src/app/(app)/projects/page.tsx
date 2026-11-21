import Link from "next/link";
import type { Metadata } from "next";
import { ProjectStatusBadge } from "@/components/badges";
import { Card, EmptyState, LinkButton, Meter, cx } from "@/components/ui";
import { PROJECT_STATUSES } from "@/lib/constants";
import { php, pct } from "@/lib/format";
import { projectMetrics } from "@/lib/metrics";
import { getSession } from "@/lib/org";
import type { ProjectSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Projects" };

const FILTERS = [{ value: "all", label: "All" }, ...PROJECT_STATUSES];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const { supabase, orgId } = await getSession();

  let query = supabase.from("project_summary").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const projects = (data ?? []) as ProjectSummary[];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-1 text-sm text-muted">Contract value, spending and profit for every job.</p>
        </div>
        <LinkButton href="/projects/new">+ New project</LinkButton>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto overflow-y-hidden">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/projects" : `/projects?status=${f.value}`}
            className={cx(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium",
              status === f.value ? "bg-ink text-white" : "text-muted hover:bg-surface hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <Card>
          <EmptyState title={status === "all" ? "No projects yet" : "No projects with this status"}>
            {status === "all" && (
              <LinkButton href="/projects/new" className="mt-4">
                Create your first project
              </LinkButton>
            )}
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => {
            const m = projectMetrics(p);
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="group">
                <Card className="h-full p-4 transition-shadow group-hover:shadow-md sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-ink group-hover:text-brand">{p.name}</h2>
                      <p className="truncate text-sm text-muted">
                        {[p.client_name, p.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted">Contract</dt>
                      <dd className="font-semibold tabular-nums text-ink">{php(m.revised)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Collected</dt>
                      <dd className="font-semibold tabular-nums text-ink">{php(m.collected)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Projected profit</dt>
                      <dd className={cx("font-semibold tabular-nums", m.projectedProfit < 0 ? "text-loss" : "text-gain")}>
                        {php(m.projectedProfit)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>
                        Spent {php(m.cost)} {m.budget > 0 && <>of {php(m.budget)} budget</>}
                      </span>
                      <span className={cx("tabular-nums", m.overBudget && "font-medium text-loss")}>
                        {m.budget > 0 ? pct(m.budgetUsed, 0) : "No budget"}
                      </span>
                    </div>
                    <Meter value={m.budgetUsed} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
