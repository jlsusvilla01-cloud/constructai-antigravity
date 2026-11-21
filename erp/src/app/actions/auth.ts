"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

/** Only same-site paths, so a crafted link can't bounce people to another website. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/dashboard";
};

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Wrong email or password." };

  redirect(safeNext(formData.get("next")));
}

export async function signup(_: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const inviteToken = String(formData.get("invite_token") ?? "").trim();

  const supabase = await createClient();

  if (inviteToken) {
    // Joining a company from an invitation link: the email must match the invitation.
    const { data } = await supabase.rpc("invitation_preview", { invite_token: inviteToken });
    const inv = (data as { email: string; accepted: boolean }[] | null)?.[0];
    if (!inv || inv.accepted) return { error: "This invitation link is no longer valid." };
    if (inv.email !== email.toLowerCase()) return { error: `This invitation is for ${inv.email}. Sign up with that email.` };
  } else if (!companyName) {
    return { error: "Enter your company name." };
  }
  if (!email) return { error: "Enter your email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: inviteToken
        ? { full_name: fullName, invite_token: inviteToken }
        : { full_name: fullName, company_name: companyName },
    },
  });
  if (error) return { error: error.message };

  // When email confirmation is turned on, there is no session yet.
  if (!data.session) redirect("/login?notice=confirm-email");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
