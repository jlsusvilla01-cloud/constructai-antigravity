import Link from "next/link";
import type { Metadata } from "next";
import { signup } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Set up your company in under a minute.</p>
      <ActionForm action={signup} className="mt-5 space-y-4" resetOnSuccess={false}>
        <Field label="Your name">
          <Input name="full_name" autoComplete="name" placeholder="Engr. Juan Dela Cruz" />
        </Field>
        <Field label="Company name">
          <Input name="company_name" autoComplete="organization" placeholder="Dela Cruz Builders" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </ActionForm>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
