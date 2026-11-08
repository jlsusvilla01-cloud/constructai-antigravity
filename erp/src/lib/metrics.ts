import type { ProjectSummary } from "./types";
import { toNum } from "./format";

/** Derived profit figures for one project. */
export function projectMetrics(p: ProjectSummary) {
  const revised = toNum(p.revised_contract);
  const cost = toNum(p.cost_to_date);
  const budget = toNum(p.budget);
  const billed = toNum(p.billed);
  const collected = toNum(p.collected);

  // If spending already exceeds the budget, the budget is no longer a credible
  // final-cost estimate; use actual cost instead.
  const estFinalCost = p.status === "completed" ? cost : Math.max(budget, cost);
  const projectedProfit = revised - estFinalCost;
  const projectedMargin = revised > 0 ? (projectedProfit / revised) * 100 : NaN;
  const budgetUsed = budget > 0 ? (cost / budget) * 100 : NaN;
  const billedPct = revised > 0 ? (billed / revised) * 100 : NaN;
  const cashPosition = collected - cost;
  const remainingToBill = Math.max(revised - billed, 0);

  return {
    revised,
    cost,
    budget,
    billed,
    collected,
    receivable: toNum(p.receivable),
    overdue: toNum(p.overdue),
    estFinalCost,
    projectedProfit,
    projectedMargin,
    budgetUsed,
    billedPct,
    cashPosition,
    remainingToBill,
    overBudget: budget > 0 && cost > budget,
  };
}
