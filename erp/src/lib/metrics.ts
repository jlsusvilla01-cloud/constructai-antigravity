import type { ProjectSummary } from "./types";
import { toNum } from "./format";

/** Derived profit figures for one project. */
export function projectMetrics(p: ProjectSummary) {
  const revised = toNum(p.revised_contract);
  const cost = toNum(p.cost_to_date);
  const budget = toNum(p.budget);
  const billed = toNum(p.billed);
  const collected = toNum(p.collected);
  // Open purchase orders (ordered or delivered, not yet paid) will become cost.
  const committed = toNum(p.committed_cost);
  const costWithCommitted = cost + committed;

  // If spending (incl. what's already ordered) exceeds the budget, the budget is no
  // longer a credible final-cost estimate; use actual + committed cost instead.
  const estFinalCost = p.status === "completed" ? costWithCommitted : Math.max(budget, costWithCommitted);
  const projectedProfit = revised - estFinalCost;
  const projectedMargin = revised > 0 ? (projectedProfit / revised) * 100 : NaN;
  const budgetUsed = budget > 0 ? (cost / budget) * 100 : NaN;
  const committedUsed = budget > 0 ? (costWithCommitted / budget) * 100 : NaN;
  const billedPct = revised > 0 ? (billed / revised) * 100 : NaN;
  const cashPosition = collected - cost;
  // Retention held by the client is billed later (on release), so it is part of this.
  const remainingToBill = Math.max(revised - billed, 0);

  return {
    revised,
    cost,
    budget,
    billed,
    collected,
    receivable: toNum(p.receivable),
    overdue: toNum(p.overdue),
    committed,
    payable: toNum(p.payable),
    boqTotal: toNum(p.boq_total),
    percentComplete: toNum(p.percent_complete),
    retentionHeld: toNum(p.retention_held),
    downpaymentUnrecouped: Math.max(toNum(p.downpayment_billed) - toNum(p.downpayment_recouped), 0),
    estFinalCost,
    projectedProfit,
    projectedMargin,
    budgetUsed,
    committedUsed,
    billedPct,
    cashPosition,
    remainingToBill,
    overBudget: budget > 0 && cost > budget,
    /** Not over yet, but actual + committed purchase orders already exceed the budget. */
    committedOverBudget: budget > 0 && cost <= budget && costWithCommitted > budget,
  };
}
