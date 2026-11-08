"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Wrong email or password." };

  redirect("/dashboard");
}

export async function signup(_: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!companyName) return { error: "Enter your company name." };
  if (!email) return { error: "Enter your email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, company_name: companyName } },
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
