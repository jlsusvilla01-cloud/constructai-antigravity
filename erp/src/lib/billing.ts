import type { ProjectSummary } from "./types";

/**
 * Progress billing maths (Philippine construction practice).
 *
 * Each progress billing claims work accomplished since the last one:
 *   gross      = contract × cumulative % complete − gross already billed
 *   retention  = gross × retention %            (withheld by the client until completion)
 *   recoupment = gross × downpayment ÷ contract  (pays back the advance, proportionally;
 *                the final 100% billing recoups whatever is left)
 *   net due    = gross − retention − recoupment
 */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type ProgressInput = {
  /** Contract incl. approved change orders. */
  revisedContract: number;
  retentionPct: number;
  /** Downpayment billed so far, and how much of it has been recouped. */
  downpaymentBilled: number;
  downpaymentRecouped: number;
  /** Gross of progress billings so far and the % complete they reached. */
  prevGross: number;
  prevPct: number;
  /** Cumulative % complete as of this billing. */
  cumulativePct: number;
};

export type ProgressResult =
  | { error: string }
  | { gross: number; retention: number; recoupment: number; net: number; grossToDate: number };

export function computeProgressBilling(i: ProgressInput): ProgressResult {
  const pct = i.cumulativePct;
  if (!Number.isFinite(pct) || pct <= 0) return { error: "Enter the cumulative % of work accomplished." };
  if (pct > 100) return { error: "Percent complete can’t be more than 100%." };
  if (pct <= i.prevPct) return { error: `Must be higher than the last progress billing (${i.prevPct}% complete).` };
  if (!(i.revisedContract > 0)) return { error: "Set the contract amount on the project first." };

  const grossToDate = round2((i.revisedContract * pct) / 100);
  const gross = round2(grossToDate - i.prevGross);
  if (gross <= 0) return { error: "Nothing new to bill at that percentage." };

  const retention = round2((gross * Math.max(i.retentionPct, 0)) / 100);
  const dpLeft = Math.max(round2(i.downpaymentBilled - i.downpaymentRecouped), 0);
  const recoupment =
    pct >= 100 ? dpLeft : Math.min(dpLeft, round2((gross * i.downpaymentBilled) / i.revisedContract));
  const net = round2(gross - retention - recoupment);
  if (net <= 0) return { error: "After retention and recoupment there’s nothing left to bill." };

  return { gross, retention, recoupment, net, grossToDate };
}

/** Downpayment still to bill: contract × downpayment % − already billed. */
export function downpaymentDue(revisedContract: number, downpaymentPct: number, alreadyBilled: number) {
  return Math.max(round2((revisedContract * downpaymentPct) / 100 - alreadyBilled), 0);
}

/** The figures the billing form needs for one project. */
export function toBillingProject(p: ProjectSummary) {
  return {
    id: p.id,
    name: p.name,
    revisedContract: Number(p.revised_contract) || 0,
    retentionPct: Number(p.retention_pct) || 0,
    downpaymentPct: Number(p.downpayment_pct) || 0,
    downpaymentBilled: Number(p.downpayment_billed) || 0,
    downpaymentRecouped: Number(p.downpayment_recouped) || 0,
    prevGross: Number(p.progress_billed_gross) || 0,
    prevPct: Number(p.percent_complete) || 0,
    retentionHeld: Number(p.retention_held) || 0,
  };
}
