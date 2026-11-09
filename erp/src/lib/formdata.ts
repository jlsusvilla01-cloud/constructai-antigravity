import { revalidatePath } from "next/cache";
import { num } from "./format";
import type { ActionState } from "./types";

export { num };

// Helpers shared by the server actions.

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optStr = (fd: FormData, k: string) => str(fd, k) || null;
export const optDate = (fd: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(str(fd, k)) ? str(fd, k) : null);

/** A peso amount from the form. NaN when empty or not a number. */
export const amount = (fd: FormData, k: string) => num(str(fd, k));

export const oneOf = <T extends string>(list: { value: T }[], v: string, fallback: T): T =>
  (list.find((x) => x.value === v)?.value ?? fallback) as T;

export const ok = (): ActionState => ({ ok: true, at: Date.now() });
export const fail = (error: string): ActionState => ({ error, at: Date.now() });

export function refresh() {
  revalidatePath("/", "layout");
}

/** Postgres raises friendly messages from triggers; strip the noise around them. */
export function dbMessage(e: { message: string; code?: string } | null) {
  if (!e) return "";
  if (e.code === "23505") return "That already exists.";
  if (e.code === "42501") return "You don’t have permission to do that.";
  return e.message;
}
