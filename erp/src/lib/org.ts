import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/** The signed-in user and their company. Cached for the duration of a request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/login?error=no-company");

  const org = membership.organizations as unknown as { name: string } | null;
  return {
    supabase,
    user,
    orgId: membership.org_id as string,
    orgName: org?.name ?? "My Company",
    role: membership.role as "owner" | "member",
  };
});
