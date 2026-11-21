import Link from "next/link";
import type { Metadata } from "next";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; next?: string }>;
}) {
  const { notice, next } = await searchParams;
  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold text-ink">Log in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back.</p>
      {notice === "confirm-email" && (
        <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-strong">
          Check your email to confirm your account, then log in.
        </p>
      )}
      <ActionForm action={login} className="mt-5 space-y-4" resetOnSuccess={false}>
        {next && <input type="hidden" name="next" value={next} />}
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="w-full" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </ActionForm>
      <p className="mt-5 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
