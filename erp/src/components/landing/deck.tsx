"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export type SlideMeta = { id: string; label: string; dark: boolean };

/**
 * Full-screen "presentation" frame: one slide per screen, a slide counter,
 * dot navigation, a progress bar, keyboard navigation (↑ ↓ PgUp PgDn Space Home End)
 * and reveal animations as each slide comes into view.
 */
export function Deck({ slides, header, children }: { slides: SlideMeta[]; header: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(slides.length - 1, i));
      document.getElementById(slides[n].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slides],
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    setReady(true);
    const els = slides.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-shown", "true");
            if (e.intersectionRatio >= 0.5) setActive(els.indexOf(e.target as HTMLElement));
          }
        }
      },
      { root, threshold: [0.25, 0.5] },
    );
    els.forEach((el) => io.observe(el));

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, button, a")) return;
      const cur = els.findIndex((el) => el.getAttribute("data-current") === "true");
      const i = cur < 0 ? 0 : cur;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        go(i + 1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(els.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [slides, go]);

  useEffect(() => {
    slides.forEach((s, i) => document.getElementById(s.id)?.setAttribute("data-current", String(i === active)));
  }, [active, slides]);

  const dark = slides[active]?.dark ?? true;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={ref} data-deck={ready ? "ready" : undefined} data-tone={dark ? "dark" : "light"} className="deck h-dvh overflow-y-auto overflow-x-hidden scroll-smooth lg:snap-y lg:snap-mandatory">
      {/* Progress bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-[#6f7dff] via-[#b39dff] to-[#4fd1c5] transition-[width] duration-500"
          style={{ width: `${((active + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="deck-header fixed inset-x-0 top-0 z-40 backdrop-blur-md lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          {header}
          <div className="flex items-center gap-4 sm:gap-6">
            <span className={`hidden font-mono text-xs tabular-nums sm:inline ${dark ? "text-white/60" : "text-slate-500"}`}>
              {pad(active + 1)} / {pad(slides.length)}
            </span>
            <button
              onClick={() => go(slides.findIndex((s) => s.id === "demo"))}
              className="rounded-xl bg-[#2f4ff5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2f4ff5]/30 transition hover:bg-[#2442e0]"
            >
              Book a demo
            </button>
          </div>
        </div>
      </header>

      {/* Dot navigation */}
      <nav aria-label="Slides" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-label={`${i + 1}. ${s.label}`}
            aria-current={i === active ? "step" : undefined}
            title={s.label}
            className={`w-2 rounded-full transition-all ${i === active ? "h-6 bg-[#4c63ff]" : `h-2 ${dark ? "bg-white/30 hover:bg-white/60" : "bg-slate-400/50 hover:bg-slate-500"}`}`}
          />
        ))}
      </nav>

      {children}
    </div>
  );
}

/** One full-screen slide. */
export function Slide({ id, dark, children, className = "" }: { id: string; dark: boolean; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      className={`slide relative flex min-h-dvh snap-start items-center overflow-hidden ${dark ? "bg-[#0a1230] text-white" : "bg-[#f4f6fa] text-[#0f172a]"} ${className}`}
    >
      {dark && (
        <>
          <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[46rem] rounded-full bg-[#2b46c9]/35 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-40 h-[28rem] w-[34rem] rounded-full bg-[#6d3fd4]/35 blur-[120px]" />
        </>
      )}
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-24 sm:px-8 lg:py-24">{children}</div>
    </section>
  );
}

/** Small uppercase label above a heading. */
export function Eyebrow({ children, dark }: { children: ReactNode; dark: boolean }) {
  return <p className={`reveal text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-[#8fa0ff]" : "text-[#3b4fe0]"}`}>{children}</p>;
}

/** Gradient accent inside a heading. */
export function Accent({ children, dark }: { children: ReactNode; dark: boolean }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${dark ? "bg-gradient-to-r from-[#8b9bff] via-[#c4b5fd] to-[#5eead4]" : "bg-gradient-to-r from-[#3b4fe0] via-[#7c5ce6] to-[#0fb5a6]"}`}
    >
      {children}
    </span>
  );
}

/** A pill with an icon, used for feature tags under headings. */
export function Chip({ children, dark }: { children: ReactNode; dark: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        dark ? "bg-white/10 text-white/85 ring-1 ring-white/15" : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[#5eead4]" : "bg-[#3b4fe0]"}`} />
      {children}
    </span>
  );
}
