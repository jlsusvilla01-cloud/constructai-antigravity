export type ProjectStatus = "bidding" | "active" | "on_hold" | "completed" | "cancelled";

export type Project = {
  id: string;
  org_id: string;
  name: string;
  client_name: string | null;
  location: string | null;
  status: ProjectStatus;
  contract_amount: number;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
};

export type ProjectSummary = Project & {
  approved_change_orders: number;
  revised_contract: number;
  cost_to_date: number;
  billed: number;
  collected: number;
  receivable: number;
  overdue: number;
};

export type ExpenseCategory =
  | "materials"
  | "labor"
  | "subcontractor"
  | "equipment"
  | "permits"
  | "overhead"
  | "other";

export type Expense = {
  id: string;
  org_id: string;
  project_id: string | null;
  date: string;
  category: ExpenseCategory;
  description: string;
  payee: string | null;
  amount: number;
  created_at: string;
};

export type BillingStatus = "paid" | "partial" | "unpaid" | "overdue";

export type BillingSummary = {
  id: string;
  org_id: string;
  project_id: string;
  reference: string | null;
  description: string;
  amount: number;
  billed_date: string;
  due_date: string | null;
  paid: number;
  balance: number;
  status: BillingStatus;
  created_at: string;
};

export type PaymentMethod = "cash" | "check" | "bank_transfer" | "gcash" | "maya" | "other";

export type Payment = {
  id: string;
  org_id: string;
  billing_id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
};

export type ChangeOrder = {
  id: string;
  org_id: string;
  project_id: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  date: string;
};

export type ActionState = { error?: string; ok?: boolean; at?: number };
