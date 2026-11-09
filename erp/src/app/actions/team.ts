"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dbMessage, fail, ok, refresh, str } from "@/lib/formdata";
import { getSession, ORG_COOKIE } from "@/lib/org";
import type { ActionState, Role } from "@/lib/types";

const COOKIE_OPTS = { path: "/", httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 };

/** Switch the company you are working in (for people who belong to more than one). */
export async function switchOrg(orgId: string) {
  const { orgs } = await getSession();
  if (orgs.some((o) => o.id === orgId)) (await cookies()).set(ORG_COOKIE, orgId, COOKIE_OPTS);
  refresh();
  redirect("/dashboard");
}

export async function renameCompany(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, isOwner } = await getSession();
  if (!isOwner) return fail("Only an owner can rename the company.");
  const name = str(fd, "name");
  if (!name) return fail("Enter the company name.");
  const { error } = await supabase.from("organizations").update({ name }).eq("id", orgId);
  if (error) return fail("Couldn’t save. " + dbMessage(error));
  refresh();
  return ok();
}

export async function createInvitation(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, isOwner } = await getSession();
  if (!isOwner) return fail("Only an owner can invite people.");
  const email = str(fd, "email").toLowerCase();
  const role: Role = str(fd, "role") === "owner" ? "owner" : "member";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");

  const { data: members } = await supabase.rpc("org_members", { target_org: orgId });
  if ((members as { email: string }[] | null)?.some((m) => m.email?.toLowerCase() === email)) {
    return fail("That person is already on the team.");
  }

  const { error } = await supabase.from("invitations").insert({ org_id: orgId, email, role });
  if (error) {
    return fail(error.code === "23505" ? "There’s already an open invitation for that email." : "Couldn’t create the invitation. " + dbMessage(error));
  }
  refresh();
  return ok();
}

export async function revokeInvitation(id: string) {
  const { supabase, isOwner } = await getSession();
  if (!isOwner) return;
  await supabase.from("invitations").delete().eq("id", id);
  refresh();
}

export async function changeRole(userId: string, role: Role): Promise<ActionState> {
  const { supabase, orgId, isOwner } = await getSession();
  if (!isOwner) return fail("Only an owner can change roles.");
  const { error } = await supabase.from("organization_members").update({ role }).eq("org_id", orgId).eq("user_id", userId);
  if (error) return fail(dbMessage(error));
  refresh();
  return ok();
}

export async function removeMember(userId: string): Promise<ActionState> {
  const { supabase, orgId, isOwner, user, orgs } = await getSession();
  if (!isOwner && userId !== user.id) return fail("Only an owner can remove people.");
  if (userId === user.id && orgs.length === 1) return fail("This is your only company, so you can’t leave it.");
  const { error } = await supabase.from("organization_members").delete().eq("org_id", orgId).eq("user_id", userId);
  if (error) return fail(dbMessage(error));
  if (userId === user.id) {
    (await cookies()).delete(ORG_COOKIE);
    refresh();
    redirect("/dashboard");
  }
  refresh();
  return ok();
}

export async function acceptInvitation(token: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("accept_invitation", { invite_token: token });
  if (error) return fail(dbMessage(error));
  (await cookies()).set(ORG_COOKIE, data as string, COOKIE_OPTS);
  refresh();
  redirect("/dashboard");
}
