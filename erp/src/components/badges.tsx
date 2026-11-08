import { BILLING_STATUS_LABEL, labelOf, PROJECT_STATUSES } from "@/lib/constants";
import type { BillingStatus, ProjectStatus } from "@/lib/types";
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
