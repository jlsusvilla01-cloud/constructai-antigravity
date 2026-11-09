import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Role } from "./types";

/** Cookie holding the company the user is currently working in (when they belong to several). */
export const ORG_COOKIE = "org";

/** The signed-in user and their current company. Cached for the duration of a request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at");

  const orgs = (rows ?? []).map((r) => ({
    id: r.org_id as string,
    role: r.role as Role,
    name: (r.organizations as unknown as { name: string } | null)?.name ?? "My Company",
  }));
  if (orgs.length === 0) redirect("/login?error=no-company");

  const wanted = (await cookies()).get(ORG_COOKIE)?.value;
  const current = orgs.find((o) => o.id === wanted) ?? orgs[0];

  return {
    supabase,
    user,
    orgId: current.id,
    orgName: current.name,
    role: current.role,
    isOwner: current.role === "owner",
    orgs,
  };
});
