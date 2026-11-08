const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const pesoExact = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const toNum = (v: unknown) => Number(v ?? 0) || 0;

/** ₱1,234,567 */
export const php = (n: unknown) => peso.format(toNum(n));

/** ₱1,234,567.50 */
export const phpExact = (n: unknown) => pesoExact.format(toNum(n));

/** ₱1.23M / ₱850K — for tight spaces like chart axes */
export function phpShort(n: unknown) {
  const v = toNum(n);
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e6) return `${sign}₱${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${sign}₱${Math.round(a / 1e3)}K`;
  return `${sign}₱${Math.round(a)}`;
}

export const pct = (n: number, digits = 1) =>
  Number.isFinite(n) ? `${n.toFixed(digits)}%` : "—";

const dateFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  // Dates come as YYYY-MM-DD; parse as local date, not UTC.
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return dateFmt.format(new Date(y, m - 1, day));
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
