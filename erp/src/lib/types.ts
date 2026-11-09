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
  retention_pct: number;
  downpayment_pct: number;
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
  progress_billed_gross: number;
  percent_complete: number;
  downpayment_billed: number;
  downpayment_recouped: number;
  retention_held: number;
  boq_total: number;
  committed_cost: number;
  payable: number;
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
  boq_item_id: string | null;
  created_at: string;
};

export type BillingStatus = "paid" | "partial" | "unpaid" | "overdue";

export type BillingKind = "downpayment" | "progress" | "retention_release" | "other";

export type BillingSummary = {
  id: string;
  org_id: string;
  project_id: string;
  reference: string | null;
  description: string;
  /** Net amount due from the client (gross − retention − recoupment). */
  amount: number;
  kind: BillingKind;
  percent_complete: number | null;
  gross_amount: number;
  retention_amount: number;
  recoupment_amount: number;
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

export type Role = "owner" | "member";

export type BoqItem = {
  id: string;
  org_id: string;
  project_id: string;
  item_no: string | null;
  description: string;
  category: ExpenseCategory;
  unit: string | null;
  quantity: number;
  unit_cost: number;
  amount: number;
  sort_order: number;
};

export type Supplier = {
  id: string;
  org_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  tin: string | null;
  address: string | null;
  notes: string | null;
};

export type PoStatus = "draft" | "ordered" | "received" | "cancelled";

export type PurchaseOrderSummary = {
  id: string;
  org_id: string;
  project_id: string;
  supplier_id: string;
  supplier_name: string;
  po_number: string;
  category: ExpenseCategory;
  boq_item_id: string | null;
  status: PoStatus;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  notes: string | null;
  expense_id: string | null;
  paid_date: string | null;
  total: number;
  item_count: number;
  created_at: string;
};

export type PurchaseOrderItem = {
  id: string;
  purchase_order_id: string;
  description: string;
  unit: string | null;
  quantity: number;
  unit_cost: number;
  amount: number;
  sort_order: number;
};

export type ActionState = { error?: string; ok?: boolean; at?: number };
