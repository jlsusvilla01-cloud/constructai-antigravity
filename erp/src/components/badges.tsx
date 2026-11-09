import { BILLING_STATUS_LABEL, labelOf, PROJECT_STATUSES } from "@/lib/constants";
import type { BillingStatus, PoStatus, ProjectStatus } from "@/lib/types";
import { Badge, type Tone } from "./ui";

const PROJECT_TONE: Record<ProjectStatus, Tone> = {
  bidding: "warn",
  active: "brand",
  on_hold: "neutral",
  completed: "gain",
  cancelled: "neutral",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={PROJECT_TONE[status]}>{labelOf(PROJECT_STATUSES, status)}</Badge>;
}

const BILLING_TONE: Record<BillingStatus, Tone> = {
  paid: "gain",
  partial: "brand",
  unpaid: "neutral",
  overdue: "loss",
};

export function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return <Badge tone={BILLING_TONE[status]}>{BILLING_STATUS_LABEL[status]}</Badge>;
}

/** A PO's delivery status, or "Paid" once its cost is recorded. */
export function PoStatusBadge({ status, paid }: { status: PoStatus; paid: boolean }) {
  if (paid) return <Badge tone="gain">{status === "received" ? "Received · paid" : "Paid"}</Badge>;
  const map: Record<PoStatus, [Tone, string]> = {
    draft: ["neutral", "Draft"],
    ordered: ["brand", "Ordered"],
    received: ["warn", "Received · unpaid"],
    cancelled: ["neutral", "Cancelled"],
  };
  const [tone, label] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
