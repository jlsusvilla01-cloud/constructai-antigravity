import Link from "next/link";
import type { Metadata } from "next";
import { logout, signup } from "@/app/actions/auth";
import { acceptInvitation } from "@/app/actions/team";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Join your team" };

const ROLE_LABEL = { owner: "an owner", member: "staff" } as const;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const valid = /^[0-9a-f-]{36}$/i.test(token);
  const [{ data }, { data: auth }] = await Promise.all([
    valid ? supabase.rpc("invitation_preview", { invite_token: token }) : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
  ]);
  const inv = (data as { org_name: string; email: string; role: "owner" | "member"; accepted: boolean }[] | null)?.[0];
  const user = auth.user;

  if (!inv || inv.accepted) {
    return (
      <Card className="p-6">
        <h1 className="text-lg font-semibold text-ink">This link has expired</h1>
        <p className="mt-1 text-sm text-muted">
          The invitation was already used or cancelled. Ask whoever invited you for a new link.
        </p>
        <Link href={user ? "/dashboard" : "/login"} className="mt-5 inline-block text-sm font-medium text-brand hover:underline">
          {user ? "Go to your dashboard" : "Log in"}
        </Link>
      </Card>
    );
  }

  const heading = (
    <>
      <h1 className="text-lg font-semibold text-ink">Join {inv.org_name}</h1>
      <p className="mt-1 text-sm text-muted">
        You’ve been invited as {ROLE_LABEL[inv.role]} for <span className="font-medium text-ink">{inv.email}</span>.
      </p>
    </>
  );

  if (user) {
    const sameEmail = user.email?.toLowerCase() === inv.email;
    return (
      <Card className="p-6">
        {heading}
        {sameEmail ? (
          <ActionForm action={acceptInvitation.bind(null, token)} className="mt-5" resetOnSuccess={false}>
            <SubmitButton className="w-full" pendingText="Joining…">
              Join {inv.org_name}
            </SubmitButton>
          </ActionForm>
        ) : (
          <>
            <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
              You’re logged in as {user.email}. Log out, then open this link again and use {inv.email}.
            </p>
            <form action={logout} className="mt-4">
              <button className="text-sm font-medium text-brand hover:underline">Log out</button>
            </form>
          </>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {heading}
      <ActionForm action={signup} className="mt-5 space-y-4" resetOnSuccess={false}>
        <input type="hidden" name="invite_token" value={token} />
        <Field label="Your name">
          <Input name="full_name" autoComplete="name" placeholder="Ana Reyes" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" value={inv.email} readOnly className="bg-canvas text-muted" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account & join
        </SubmitButton>
      </ActionForm>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account with {inv.email}?{" "}
        <Link href={`/login?next=/invite/${token}`} className="font-medium text-brand hover:underline">
          Log in to accept
        </Link>
      </p>
    </Card>
  );
}
