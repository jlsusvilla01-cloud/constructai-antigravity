"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/types";
import { Button, cx, type ButtonVariant } from "./ui";

/** Pending state of the enclosing ActionForm (null outside one, where useFormStatus applies). */
const PendingContext = createContext<boolean | null>(null);

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const formStatus = useFormStatus();
  const pending = useContext(PendingContext) ?? formStatus.pending;
  return (
    <Button type="submit" disabled={pending} variant={variant} className={className}>
      {pending ? pendingText : children}
    </Button>
  );
}

/**
 * A form bound to a server action that returns ActionState.
 * Shows the error message, and clears itself after a successful save.
 *
 * Submits through onSubmit rather than <form action>, because React resets a
 * <form action> after every submission — which would wipe what the person typed
 * when the server reports an error.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = true,
  onSuccess,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!state.ok) return;
    onSuccessRef.current?.();
    if (resetOnSuccess) {
      ref.current?.reset();
      // Collapse an enclosing <details> "Add" panel after saving.
      ref.current?.closest("details")?.removeAttribute("open");
    }
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const fd = new FormData(e.currentTarget, submitter);
        startTransition(() => formAction(fd));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Small inline form for one-click destructive actions, with a confirm prompt. */
export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this record? This can’t be undone.",
  className,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className={cx(
          "rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-loss-soft hover:text-loss",
          className,
        )}
      >
        {label}
      </button>
    </form>
  );
}
