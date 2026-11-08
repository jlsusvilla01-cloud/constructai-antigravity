import type { BillingStatus, ExpenseCategory, PaymentMethod, ProjectStatus } from "./types";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "bidding", label: "Bidding" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "materials", label: "Materials" },
  { value: "labor", label: "Labor" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "equipment", label: "Equipment" },
  { value: "permits", label: "Permits & fees" },
  { value: "overhead", label: "Overhead" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "other", label: "Other" },
];

export const BILLING_STATUS_LABEL: Record<BillingStatus, string> = {
  paid: "Paid",
  partial: "Partly paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
};

export const labelOf = <T extends string>(list: { value: T; label: string }[], v: T) =>
  list.find((x) => x.value === v)?.label ?? v;
