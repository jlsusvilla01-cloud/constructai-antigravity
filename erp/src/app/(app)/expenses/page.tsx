import type { Metadata } from "next";
import { AddPanel, ExpenseForm, ExpenseTable } from "@/components/records";
import { Card, CardHeader, PageHeader, Select, Stat } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { php, toNum } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { Expense } from "@/lib/types";

export const metadata: Metadata = { title: "Costs" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; category?: string; month?: string }>;
}) {
  const { project = "", category = "", month = "" } = await searchParams;
  const { supabase, orgId, isOwner } = await getSession();

  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  const projects = projectRows ?? [];
  const projectNames = new Map(projects.map((p) => [p.id as string, p.name as string]));

  let q = supabase.from("expenses").select("*").eq("org_id", orgId).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  if (project === "overhead") q = q.is("project_id", null);
  else if (project) q = q.eq("project_id", project);
  if (category) q = q.eq("category", category);
  if (/^\d{4}-\d{2}$/.test(month)) {
    const [y, mo] = month.split("-").map(Number);
    const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
    q = q.gte("date", `${month}-01`).lt("date", `${next}-01`);
  }
  const { data } = await q;
  const expenses = (data ?? []) as Expense[];

  const total = expenses.reduce((s, e) => s + toNum(e.amount), 0);
  const projectCost = expenses.filter((e) => e.project_id).reduce((s, e) => s + toNum(e.amount), 0);
  const filtered = Boolean(project || category || month);

  // Projects you can still log costs against (not cancelled).
  const open = projects.filter((p) => p.status !== "cancelled").map((p) => ({ id: p.id as string, name: p.name as string }));

  return (
    <>
      <PageHeader title="Costs" sub="Every peso spent — on projects and on running the company." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={filtered ? "Total (filtered)" : "Total recorded"} value={php(total)} sub={`${expenses.length} entries`} />
        <Stat label="Project costs" value={php(projectCost)} />
        <Stat label="Company overhead" value={php(total - projectCost)} />
      </div>

      <Card>
        <CardHeader title="Cost entries" />
        <AddPanel label="Add a cost">
          <ExpenseForm projects={open} />
        </AddPanel>

        <form className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3 sm:px-5">
          <Select name="project" defaultValue={project} className="w-auto min-w-40 flex-1 sm:flex-none">
            <option value="">All projects & overhead</option>
            <option value="overhead">Overhead only</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select name="category" defaultValue={category} className="w-auto min-w-36 flex-1 sm:flex-none">
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Month"
          />
          <button className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas">Filter</button>
          {filtered && (
            <a href="/expenses" className="px-2 py-2 text-sm text-muted hover:text-ink">
              Clear
            </a>
          )}
        </form>

        <ExpenseTable expenses={expenses} projectNames={projectNames} canDelete={isOwner} />
      </Card>
    </>
  );
}
