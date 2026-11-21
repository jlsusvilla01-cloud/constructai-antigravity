import { php, pct } from "@/lib/format";

/** Single-series horizontal bars, largest first, value at the tip. */
export function BreakdownBars({ rows }: { rows: { label: string; value: number }[] }) {
  const sorted = rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, r) => s + r.value, 0);
  const max = sorted[0]?.value ?? 0;
  if (sorted.length === 0) return <p className="py-6 text-center text-sm text-muted">Nothing recorded yet.</p>;

  return (
    <ul className="space-y-3">
      {sorted.map((r) => (
        <li key={r.label} title={`${r.label}: ${php(r.value)} (${pct((r.value / total) * 100)})`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink">{r.label}</span>
            <span className="tabular-nums text-muted">
              <span className="font-medium text-ink">{php(r.value)}</span> · {pct((r.value / total) * 100, 0)}
            </span>
          </div>
          <div className="h-2.5 w-full">
            <div className="h-full rounded-r-[4px] bg-brand" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
