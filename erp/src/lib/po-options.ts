import type { getSession } from "./org";

type Supabase = Awaited<ReturnType<typeof getSession>>["supabase"];

/** Projects, suppliers and BOQ lines for the purchase order form. */
export async function loadPoFormOptions(supabase: Supabase, orgId: string) {
  const [{ data: projects }, { data: suppliers }, { data: boq }] = await Promise.all([
    supabase.from("projects").select("id, name, status").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, name").eq("org_id", orgId).order("name"),
    supabase.from("boq_items").select("id, project_id, item_no, description").eq("org_id", orgId).order("sort_order"),
  ]);
  const boqByProject: Record<string, { id: string; label: string }[]> = {};
  for (const b of boq ?? []) {
    (boqByProject[b.project_id] ??= []).push({ id: b.id, label: [b.item_no, b.description].filter(Boolean).join(" ") });
  }
  return {
    projects: (projects ?? [])
      .filter((p) => p.status !== "cancelled")
      .map((p) => ({ id: p.id as string, label: p.name as string })),
    suppliers: (suppliers ?? []).map((s) => ({ id: s.id as string, label: s.name as string })),
    boqByProject,
  };
}
