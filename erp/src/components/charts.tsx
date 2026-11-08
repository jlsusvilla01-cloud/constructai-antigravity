"use client";

import { useEffect, useRef, useState } from "react";
import { php, phpShort } from "@/lib/format";

export type MonthPoint = { label: string; inflow: number; outflow: number };

/** Clean axis maximum + ticks (0, step, 2·step, …). */
function niceScale(max: number, count = 4) {
  if (max <= 0) return { top: 1, ticks: [0] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

/**
 * Grouped columns: money collected vs money spent per month.
 * Hovering (or tapping) a month shows both values and the net.
 */
export function CashFlowChart({ data }: { data: MonthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  // Draw at the real pixel width so text stays 11px instead of being scaled.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = width;
  const H = 240;
  const pad = { l: 52, r: 8, t: 12, b: 28 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const { top, ticks } = niceScale(Math.max(...data.flatMap((d) => [d.inflow, d.outflow]), 0));
  const band = plotW / data.length;
  const barW = Math.min(14, (band - 10) / 2);
  const y = (v: number) => pad.t + plotH - (v / top) * plotH;

  // Column with 4px rounded top, square at the baseline.
  const col = (x: number, v: number) => {
    const h = Math.max((v / top) * plotH, 0);
    if (h < 0.5) return "";
    const r = Math.min(4, h, barW / 2);
    const yt = pad.t + plotH - h;
    const yb = pad.t + plotH;
    return `M${x},${yb}V${yt + r}Q${x},${yt} ${x + r},${yt}H${x + barW - r}Q${x + barW},${yt} ${x + barW},${yt + r}V${yb}Z`;
  };

  const active = hover !== null ? data[hover] : null;
  const tipLeft = hover !== null ? ((pad.l + band * hover + band / 2) / W) * 100 : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-series-in" /> Collected from clients
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-series-out" /> Spent (project costs + overhead)
        </span>
      </div>
      <div className="relative" ref={boxRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label="Monthly money collected versus spent">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-muted)">
                {phpShort(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x0 = pad.l + band * i + (band - (barW * 2 + 2)) / 2;
            return (
              <g key={d.label}>
                {hover === i && (
                  <rect x={pad.l + band * i} y={pad.t} width={band} height={plotH} fill="var(--color-canvas)" />
                )}
                <path d={col(x0, d.inflow)} fill="var(--color-series-in)" />
                <path d={col(x0 + barW + 2, d.outflow)} fill="var(--color-series-out)" />
                {(band >= 30 || (data.length - 1 - i) % 2 === 0 || hover === i) && (
                  <text
                    x={pad.l + band * i + band / 2}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fill={hover === i ? "var(--color-ink)" : "var(--color-muted)"}
                  >
                    {d.label}
                  </text>
                )}
                {/* Hit target: the whole month band, taller than the marks. */}
                <rect
                  x={pad.l + band * i}
                  y={pad.t}
                  width={band}
                  height={plotH + pad.b}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(hover === i ? null : i)}
                />
              </g>
            );
          })}
          <line x1={pad.l} x2={W - pad.r} y1={pad.t + plotH} y2={pad.t + plotH} stroke="var(--color-faint)" strokeWidth={1} />
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-48 -translate-x-1/2 rounded-lg border border-line bg-surface p-3 text-xs shadow-lg"
            style={{ left: `clamp(6rem, ${tipLeft}%, calc(100% - 6rem))` }}
          >
            <p className="mb-1.5 font-semibold text-ink">{active.label}</p>
            <p className="flex justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 rounded-sm bg-series-in" /> Collected
              </span>
              <span className="tabular-nums text-ink">{php(active.inflow)}</span>
            </p>
            <p className="mt-1 flex justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 rounded-sm bg-series-out" /> Spent
              </span>
              <span className="tabular-nums text-ink">{php(active.outflow)}</span>
            </p>
            <p className="mt-1.5 flex justify-between gap-2 border-t border-line pt-1.5">
              <span className="text-muted">Net</span>
              <span className={`font-semibold tabular-nums ${active.inflow - active.outflow < 0 ? "text-loss" : "text-gain"}`}>
                {php(active.inflow - active.outflow)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
