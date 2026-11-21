import type { Metadata } from "next";
import Image from "next/image";
import localFont from "next/font/local";
import type { CSSProperties, ReactNode } from "react";
import { CallingCard } from "@/components/landing/calling-card";
import { Accent, Chip, Deck, Eyebrow, Slide, type SlideMeta } from "@/components/landing/deck";
import { DemoForm } from "@/components/landing/demo-form";

// Static presentation page — no backend, no database calls.

// Bundled with the app (variable font, OFL) so builds never depend on Google Fonts being reachable.
const jakarta = localFont({
  src: "../fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "ConstructAI — Project costs, billings and profit for Philippine contractors" },
  description:
    "Progress billing with retention, BOQ budgets, purchase orders, daily site logs and payroll — one system for Philippine contractors.",
};

const SLIDES: SlideMeta[] = [
  { id: "top", label: "ConstructAI", dark: true },
  { id: "problem", label: "The problem", dark: false },
  { id: "fix", label: "One system", dark: true },
  { id: "billing", label: "Progress billing", dark: false },
  { id: "budget", label: "BOQ & budget", dark: true },
  { id: "purchasing", label: "Purchasing", dark: false },
  { id: "site-log", label: "Site log & payroll", dark: true },
  { id: "profit", label: "Profit", dark: false },
  { id: "team", label: "Team", dark: true },
  { id: "philippines", label: "Made for the Philippines", dark: false },
  { id: "demo", label: "Book a demo", dark: true },
  { id: "made-by", label: "Made by", dark: true },
];

const d = (i: number): CSSProperties => ({ transitionDelay: `${i * 90}ms` });

function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`reveal mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl ${className}`} style={d(1)}>{children}</h2>;
}

function Icon({ d: path, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  ruler: "M3 17L17 3l4 4L7 21H3v-4zM14 6l1.5 1.5M11 9l1.5 1.5M8 12l1.5 1.5",
  file: "M6 2h9l5 5v15H6V2zm8 1.5V8h4.5M9 13h7M9 17h7",
  cart: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z",
  helmet: "M4 17h16M6 17v-3a6 6 0 0112 0v3M12 8V5M9 9.5V7M15 9.5V7",
  peso: "M7 20V4h6a4 4 0 010 8H7M4 8h12M4 11h12",
  key: "M15 7a4 4 0 11-3.5 6L5 19.5V22H2v-3l6.5-6.5A4 4 0 0115 7zm1 1h.01",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3.5a4 4 0 010 7.5M22 21v-1a6 6 0 00-4-5.6",
  receipt: "M6 2h12v20l-3-2-3 2-3-2-3 2V2zm3 6h6M9 12h6M9 16h3",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zm0-15v5l3 2",
  phone: "M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm3 17h2",
  shield: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3zm-3 10l2 2 4-4",
  swap: "M4 7h13l-3-3M20 17H7l3 3",
  mail: "M3 5h18v14H3V5zm0 0l9 7 9-7",
  call: "M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2z",
  card: "M3 5h18v14H3V5zm4 4a2 2 0 104 0 2 2 0 00-4 0zm-1 7a3 3 0 016 0m3-6h3m-3 4h3",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
};

function Logo() {
  return (
    <a href="#top" className="deck-logo flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4c63ff" />
            <stop offset="1" stopColor="#7c5ce6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#lg)" />
        <path d="M8 22V13l8-5 8 5v9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M13 22v-5h6v5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
      ConstructAI
    </a>
  );
}

/** White card used for product mockups. */
function Mock({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`reveal rounded-3xl bg-white p-5 text-slate-900 shadow-2xl shadow-[#0a1230]/25 ring-1 ring-slate-900/5 sm:p-6 ${className}`} style={style}>{children}</div>;
}

function Bar({ value, tone = "bg-[#4c63ff]", extra }: { value: number; tone?: string; extra?: number }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full ${tone}`} style={{ width: `${Math.min(value, 100)}%` }} />
      {extra ? <div className="h-full bg-amber-400" style={{ width: `${extra}%` }} /> : null}
    </div>
  );
}

const Sample = ({ dark = false }: { dark?: boolean }) => (
  <p className={`mt-3 text-[11px] ${dark ? "text-white/40" : "text-slate-400"}`}>Sample project and numbers</p>
);

export default function Home() {
  return (
    <div className={jakarta.variable}>
      <Deck slides={SLIDES} header={<Logo />}>
        {/* 1 ─ Hero */}
        <Slide id="top" dark>
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Eyebrow dark>For Philippine contractors</Eyebrow>
              <h1 className="reveal mt-4 text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl" style={d(1)}>
                Build profit.
                <br />
                <Accent dark>Bill on time.</Accent>
              </h1>
              <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-white/70" style={d(2)}>
                Projects, costs, progress billings, purchasing and payroll — one system for your office and your site.
              </p>
              <div className="reveal mt-8 flex flex-wrap gap-3" style={d(3)}>
                <a href="#demo" className="rounded-xl bg-[#2f4ff5] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2f4ff5]/40 transition hover:bg-[#2442e0]">
                  Book a demo
                </a>
                <a href="#problem" className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15">
                  See how it works ↓
                </a>
              </div>
            </div>

            <div className="relative">
              <Mock style={d(2)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">Santos Residence</p>
                    <p className="text-xs text-slate-500">Maria Santos · BGC, Taguig</p>
                  </div>
                  <span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[11px] font-semibold text-[#3b4fe0]">Active</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Contract", "₱4,335,000", "incl. ₱85,000 change orders"],
                    ["Projected profit", "₱685,000", "15.8% margin"],
                  ].map(([k, v, s]) => (
                    <div key={k} className="rounded-2xl bg-slate-50 p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">{k}</p>
                      <p className={`mt-0.5 text-xl font-extrabold tracking-tight ${k === "Projected profit" ? "text-emerald-600" : ""}`}>{v}</p>
                      <p className="text-[11px] text-slate-500">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Spent vs. budget</span>
                      <span className="font-semibold text-slate-700">₱1,198,500 · 33%</span>
                    </div>
                    <Bar value={33} extra={3} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Work accomplished (billed)</span>
                      <span className="font-semibold text-slate-700">60%</span>
                    </div>
                    <Bar value={60} tone="bg-gradient-to-r from-[#4c63ff] to-[#14b8a6]" />
                  </div>
                </div>
              </Mock>
              <div className="reveal absolute -right-2 -top-6 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-xl sm:-right-6" style={d(4)}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Progress billing #3</p>
                <p className="text-lg font-extrabold tracking-tight">₱652,800</p>
                <p className="text-[11px] font-medium text-emerald-600">Net of retention & recoupment</p>
              </div>
              <div className="reveal absolute -bottom-14 left-4 rounded-2xl bg-[#111a3d] px-4 py-3 shadow-xl ring-1 ring-white/10 sm:-left-6" style={d(5)}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Retention held by client</p>
                <p className="text-lg font-extrabold tracking-tight text-[#5eead4]">₱260,100</p>
              </div>
            </div>
          </div>
          <p className="reveal absolute inset-x-0 bottom-6 hidden text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 lg:block" style={d(6)}>
            Scroll or press ↓
          </p>
        </Slide>

        {/* 2 ─ Problem */}
        <Slide id="problem" dark={false}>
          <div className="text-center">
            <Eyebrow dark={false}>Sound familiar?</Eyebrow>
            <H2>
              Your profit lives in <Accent dark={false}>Excel and a shoebox of receipts.</Accent>
            </H2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [ICONS.chart, "Profit known only at turnover", "Was the job a win? You find out after the last receipt."],
              [ICONS.file, "Billings computed by hand", "Retention and downpayment recoupment, redone every month."],
              [ICONS.cart, "Purchases you forgot", "Orders and deliveries nobody counted against the budget."],
              [ICONS.helmet, "Payroll in a notebook", "Attendance, overtime and cash advances on paper."],
            ].map(([icon, title, text], i) => (
              <div key={title} className="reveal rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70" style={d(i + 2)}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef1ff] text-[#3b4fe0]">
                  <Icon d={icon} />
                </span>
                <p className="mt-5 font-bold">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 3 ─ The fix */}
        <Slide id="fix" dark>
          <div className="text-center">
            <Eyebrow dark>The fix</Eyebrow>
            <H2>
              One record, <Accent dark>from BOQ to turnover.</Accent>
            </H2>
          </div>
          <ol className="mt-16 grid grid-cols-2 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {[
              [ICONS.ruler, "Estimate", "BOQ & budget"],
              [ICONS.cart, "Buy", "Purchase orders"],
              [ICONS.helmet, "Build", "Site log & payroll"],
              [ICONS.file, "Bill", "Progress billing"],
              [ICONS.peso, "Collect", "Payments & receipts"],
              [ICONS.key, "Close", "Retention release"],
            ].map(([icon, title, sub], i) => (
              <li key={title} className="reveal relative flex flex-col items-center text-center" style={d(i + 2)}>
                {i > 0 && <span aria-hidden className="absolute right-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-[#6f7dff]/20 via-[#b39dff]/60 to-[#4fd1c5]/40 lg:block" />}
                <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-[#18245a] text-[#a9b5ff] ring-1 ring-white/10">
                  <Icon d={icon} className="h-7 w-7" />
                </span>
                <p className="mt-4 font-bold">{title}</p>
                <p className="mt-0.5 text-sm text-white/55">{sub}</p>
              </li>
            ))}
          </ol>
        </Slide>

        {/* 4 ─ Progress billing */}
        <Slide id="billing" dark={false}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow dark={false}>Progress billing</Eyebrow>
              <H2>
                Billings that <Accent dark={false}>compute themselves.</Accent>
              </H2>
              <p className="reveal mt-5 max-w-md text-lg leading-relaxed text-slate-600" style={d(2)}>
                Type the % of work accomplished. Retention, downpayment recoupment and the net amount due are worked out — and printed, with the amount in words.
              </p>
              <div className="reveal mt-6 flex flex-wrap gap-2" style={d(3)}>
                <Chip dark={false}>10% retention</Chip>
                <Chip dark={false}>Downpayment recoupment</Chip>
                <Chip dark={false}>Printable statement</Chip>
                <Chip dark={false}>Receipts per payment</Chip>
              </div>
            </div>
            <Mock style={d(2)} className="mx-auto w-full max-w-lg">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-bold">Dela Cruz Builders</p>
                  <p className="text-xs text-slate-500">Jaro, Iloilo City</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider">Progress billing</p>
                  <p className="text-xs text-slate-500">PB-03 · 60% complete</p>
                </div>
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ["Revised contract", "₱4,335,000.00", true],
                  ["Work accomplished to date (60%)", "₱2,601,000.00"],
                  ["Less: work billed previously", "(₱1,734,000.00)"],
                  ["This billing", "₱867,000.00", true],
                  ["Less: retention (10%)", "(₱86,700.00)"],
                  ["Less: recoupment of downpayment", "(₱127,500.00)"],
                ].map(([k, v, strong]) => (
                  <div key={String(k)} className="flex justify-between gap-4 py-2">
                    <dt className={strong ? "font-semibold" : "text-slate-500"}>{k}</dt>
                    <dd className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 flex items-end justify-between border-t-2 border-slate-900/80 pt-3">
                <span className="text-sm font-bold">Amount due</span>
                <span className="text-2xl font-extrabold tracking-tight">₱652,800.00</span>
              </div>
              <p className="mt-1 text-xs italic text-slate-500">Six Hundred Fifty-Two Thousand Eight Hundred Pesos Only</p>
            </Mock>
          </div>
        </Slide>

        {/* 5 ─ BOQ & budget */}
        <Slide id="budget" dark>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <Eyebrow dark>BOQ &amp; budget</Eyebrow>
              <H2>
                Budget vs. actual, <Accent dark>line by line.</Accent>
              </H2>
              <p className="reveal mt-5 max-w-md text-lg leading-relaxed text-white/70" style={d(2)}>
                Paste your BOQ from Excel. Every cost and purchase order is charged to a line, so you see overruns while there’s still time to act.
              </p>
              <div className="reveal mt-6 flex flex-wrap gap-2" style={d(3)}>
                <Chip dark>Paste from Excel</Chip>
                <Chip dark>Open POs counted</Chip>
                <Chip dark>Use BOQ as budget</Chip>
              </div>
            </div>
            <Mock style={d(2)}>
              <div className="flex items-baseline justify-between">
                <p className="font-bold">Bill of quantities</p>
                <p className="text-xs text-slate-500">11 items · ₱3,650,000</p>
              </div>
              <ul className="mt-4 space-y-3.5">
                {[
                  ["3.01", "Concrete works, 4000 psi", "₱684,000", 17, 0],
                  ["3.02", "Reinforcing steel bars", "₱607,600", 47, 0],
                  ["4.01", "Masonry, 6\" CHB", "₱322,400", 18, 12],
                  ["5.01", "Electrical works", "₱420,000", 42, 0],
                  ["6.01", "Roofing, GA26 rib-type", "₱261,000", 0, 32],
                  ["7.01", "Labor — structural & masonry", "₱760,000", 67, 0],
                ].map(([no, name, amt, used, po]) => (
                  <li key={String(no)}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                      <span className="truncate">
                        <span className="mr-1.5 text-slate-400">{no}</span>
                        {name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{amt}</span>
                    </div>
                    <Bar value={Number(used)} extra={Number(po)} />
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4c63ff]" />Spent</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />On open POs</span>
              </div>
            </Mock>
          </div>
        </Slide>

        {/* 6 ─ Purchasing */}
        <Slide id="purchasing" dark={false}>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="order-2 lg:order-1">
              <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                <Mock style={d(2)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">PO-0002</p>
                      <p className="font-bold">Wilcon Depot</p>
                    </div>
                    <span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[11px] font-semibold text-[#3b4fe0]">Ordered</span>
                  </div>
                  <ul className="mt-4 divide-y divide-slate-100 text-sm">
                    <li className="flex justify-between py-2"><span>GA26 roofing sheet, 10 ft · 60</span><span className="tabular-nums">₱81,000</span></li>
                    <li className="flex justify-between py-2"><span>Tek screws, 2&quot; · 4 box</span><span className="tabular-nums">₱3,400</span></li>
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">₱84,400</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold">
                    {["Draft", "Ordered", "Delivered", "Paid"].map((s, i) => (
                      <span key={s} className={`flex-1 rounded-full py-1 text-center ${i <= 1 ? "bg-[#2f4ff5] text-white" : "bg-slate-100 text-slate-400"}`}>{s}</span>
                    ))}
                  </div>
                </Mock>
                <div className="space-y-4">
                  <Mock style={d(3)} className="!p-5">
                    <p className="text-xs text-slate-500">Committed, not yet paid</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">₱122,400</p>
                  </Mock>
                  <Mock style={d(4)} className="!p-5">
                    <p className="text-xs text-slate-500">Delivered, unpaid to suppliers</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-amber-600">₱38,000</p>
                  </Mock>
                </div>
              </div>
              <Sample />
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow dark={false}>Purchasing</Eyebrow>
              <H2>
                Know what’s ordered <Accent dark={false}>before it’s spent.</Accent>
              </H2>
              <p className="reveal mt-5 max-w-md text-lg leading-relaxed text-slate-600" style={d(2)}>
                Numbered, printable purchase orders. Open orders count against the budget; paying one records the cost automatically.
              </p>
              <div className="reveal mt-6 flex flex-wrap gap-2" style={d(3)}>
                <Chip dark={false}>Supplier list</Chip>
                <Chip dark={false}>Print / PDF</Chip>
                <Chip dark={false}>Payables at a glance</Chip>
              </div>
            </div>
          </div>
        </Slide>

        {/* 7 ─ Site log & payroll */}
        <Slide id="site-log" dark>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow dark>Site log &amp; payroll</Eyebrow>
              <H2>
                Attendance on site. <Accent dark>Payroll in one tap.</Accent>
              </H2>
              <p className="reveal mt-5 max-w-md text-lg leading-relaxed text-white/70" style={d(2)}>
                The foreman marks full or half days and overtime from a phone. Saturday, run payroll: the labor cost lands on the project and a payroll sheet is ready to sign.
              </p>
              <div className="reveal mt-6 flex flex-wrap gap-2" style={d(3)}>
                <Chip dark>Overtime at 125%</Chip>
                <Chip dark>Site diary</Chip>
                <Chip dark>Signed payroll sheet</Chip>
              </div>
            </div>
            <div className="reveal mx-auto w-full max-w-[300px] rounded-[2.6rem] bg-[#05091c] p-3 shadow-2xl ring-1 ring-white/10" style={d(2)}>
              <div className="overflow-hidden rounded-[2rem] bg-white text-slate-900">
                <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#05091c]" />
                <div className="px-4 pb-4 pt-3">
                  <p className="text-xs text-slate-500">Santos Residence</p>
                  <p className="font-bold">Site log — Sat, Nov 21</p>
                  <ul className="mt-3 divide-y divide-slate-100 text-sm">
                    {[
                      ["Ramon V.", "Foreman", "Full day", ""],
                      ["Jun A.", "Mason", "Full day", "+2h OT"],
                      ["Leo B.", "Carpenter", "Full day", ""],
                      ["Nonoy G.", "Steelman", "Full day", "+2h OT"],
                      ["Arnel C.", "Helper", "Full day", ""],
                      ["Dodong R.", "Helper", "Half day", ""],
                    ].map(([n, p, day, ot]) => (
                      <li key={n} className="flex items-center justify-between py-2">
                        <span>
                          <span className="block font-medium">{n}</span>
                          <span className="block text-[11px] text-slate-400">{p}</span>
                        </span>
                        <span className="text-right text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${day === "Full day" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{day}</span>
                          {ot && <span className="mt-0.5 block text-[11px] text-[#3b4fe0]">{ot}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-xl bg-[#2f4ff5] py-2.5 text-center text-sm font-semibold text-white">Run payroll · ₱25,698</div>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* 8 ─ Profit */}
        <Slide id="profit" dark={false}>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="order-2 lg:order-1">
              <Mock style={d(2)}>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Collected", "₱4.27M", ""],
                    ["Spent", "₱3.66M", ""],
                    ["Net profit", "₱611K", "text-emerald-600"],
                  ].map(([k, v, c]) => (
                    <div key={k} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">{k}</p>
                      <p className={`text-lg font-extrabold tracking-tight ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex h-36 items-end gap-2.5">
                  {[
                    [55, 40],
                    [70, 52],
                    [45, 60],
                    [85, 58],
                    [62, 49],
                    [95, 66],
                  ].map(([a, b], i) => (
                    <div key={i} className="flex h-full flex-1 items-end gap-1">
                      <div className="flex-1 rounded-t-md bg-[#4c63ff]" style={{ height: `${a}%` }} />
                      <div className="flex-1 rounded-t-md bg-[#f59e0b]/80" style={{ height: `${b}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500" />Reyes Commercial — ₱2.1M overdue from client</li>
                  <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Santos Residence — ₱38,000 to pay suppliers</li>
                </ul>
              </Mock>
              <Sample />
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow dark={false}>Profit</Eyebrow>
              <H2>
                Profit on every job, <Accent dark={false}>today — not at turnover.</Accent>
              </H2>
              <p className="reveal mt-5 max-w-md text-lg leading-relaxed text-slate-600" style={d(2)}>
                Money in vs. money out by month, projected profit per project, and a short list of what needs your attention.
              </p>
            </div>
          </div>
        </Slide>

        {/* 9 ─ Team */}
        <Slide id="team" dark>
          <div className="text-center">
            <Eyebrow dark>Team</Eyebrow>
            <H2>
              Your office and your site, <Accent dark>on one team.</Accent>
            </H2>
            <p className="reveal mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70" style={d(2)}>
              Invite people with a link you send over Viber or Messenger. Everyone sees the same numbers — only owners can delete.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {[
              ["Owner", ["Everything staff can do", "Delete records and undo payments", "Invite people and set roles", "Company details on documents"]],
              ["Staff", ["View every project", "Add costs, billings, POs", "Log attendance and the site diary", "Can’t delete anything"]],
            ].map(([role, items], i) => (
              <div key={String(role)} className="reveal rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur" style={d(i + 3)}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2f4ff5]/25 text-[#a9b5ff]">
                    <Icon d={i === 0 ? ICONS.shield : ICONS.users} />
                  </span>
                  <p className="text-lg font-bold">{role}</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {(items as string[]).map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="text-[#5eead4]">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Slide>

        {/* 10 ─ Philippines */}
        <Slide id="philippines" dark={false}>
          <div className="text-center">
            <Eyebrow dark={false}>Made for the Philippines</Eyebrow>
            <H2>
              Local practice, <Accent dark={false}>built in.</Accent>
            </H2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [ICONS.file, "Retention & recoupment", "Withheld and recouped on every progress billing, released at the end."],
              [ICONS.receipt, "Acknowledgment receipts", "For every client payment, with the amount in words."],
              [ICONS.clock, "Daily-rate payroll", "Full and half days, overtime at 125%, signed payroll sheet."],
              [ICONS.phone, "GCash, Maya, checks", "Record payments however your clients pay."],
              [ICONS.card, "TIN on every document", "Billings, receipts, POs and payroll carry your company details."],
              [ICONS.swap, "Change orders", "Approved variations update the contract — pending ones don’t."],
            ].map(([icon, title, text], i) => (
              <div key={title} className="reveal flex gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70" style={d(i + 2)}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#4c63ff] to-[#7c5ce6] text-white">
                  <Icon d={icon} />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Slide>

        {/* 11 ─ Book a demo */}
        <Slide id="demo" dark>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <Eyebrow dark>Next step</Eyebrow>
              <H2>
                See your projects <Accent dark>in ConstructAI.</Accent>
              </H2>
              <ol className="reveal mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" style={d(2)}>
                {["Send your BOQ and billings", "We load your first project", "Train your office and site", "Go live"].map((t, i) => (
                  <li key={t} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <p className="font-mono text-xs text-[#8fa0ff]">{String(i + 1).padStart(2, "0")}</p>
                    <p className="mt-2 text-sm font-semibold leading-snug">{t}</p>
                  </li>
                ))}
              </ol>
              <p className="reveal mt-6 text-white/60" style={d(3)}>
                Start with one project. Your data stays yours.
              </p>
            </div>
            <DemoForm />
          </div>
        </Slide>

        {/* 12 ─ Made by */}
        <Slide id="made-by" dark className="!items-stretch">
          <div className="flex min-h-[calc(100dvh-10rem)] flex-col justify-center">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <Eyebrow dark>Made by</Eyebrow>
                <div className="reveal mt-5 flex items-center gap-3" style={d(1)}>
                  <Image src="/maker/j1-digital-cut.webp" alt="J1 Digital Marketing & AI Agency logo" width={56} height={56} className="h-14 w-14 object-contain" />
                  <div>
                    <p className="font-bold leading-tight">J1 Digital Marketing &amp; AI Agency</p>
                    <p className="text-sm text-white/55">Iloilo City, Philippines</p>
                  </div>
                </div>
                <H2 className="!mt-6">
                  Let’s build yours <Accent dark>together.</Accent>
                </H2>
                <div className="reveal mt-8 flex flex-wrap gap-2.5" style={d(3)}>
                  <a href="tel:+639480442196" className="inline-flex items-center gap-2 rounded-xl bg-[#2f4ff5] px-4 py-2.5 text-sm font-semibold shadow-lg shadow-[#2f4ff5]/40 hover:bg-[#2442e0]">
                    <Icon d={ICONS.call} className="h-4 w-4" /> Call Juone
                  </a>
                  <a href="mailto:jlsusvilla01@gmail.com?subject=ConstructAI%20for%20our%20projects" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/15">
                    <Icon d={ICONS.mail} className="h-4 w-4" /> Email
                  </a>
                  <a href="/maker/juone-susvilla.vcf" download className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/15">
                    <Icon d={ICONS.card} className="h-4 w-4" /> Save contact
                  </a>
                </div>
                <div className="reveal mt-3 flex flex-wrap gap-2.5" style={d(4)}>
                  <a href="https://engineerjsusvilla.vercel.app/" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 ring-1 ring-white/15 hover:text-white">
                    <Icon d={ICONS.link} className="h-4 w-4" /> engineerjsusvilla.vercel.app
                  </a>
                  <a href="https://j1-digital-marketing.vercel.app/" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 ring-1 ring-white/15 hover:text-white">
                    <Icon d={ICONS.link} className="h-4 w-4" /> J1 Agency
                  </a>
                </div>
              </div>
              <CallingCard />
            </div>
          </div>
          <footer className="absolute inset-x-0 bottom-0 border-t border-white/10">
            <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-4 text-xs text-white/45 sm:px-8">
              <span>
                ConstructAI · Made in Iloilo by{" "}
                <a href="https://j1-digital-marketing.vercel.app/" target="_blank" rel="noopener" className="font-semibold text-white/80 hover:text-white">
                  J1 Digital Marketing &amp; AI Agency
                </a>
              </span>
              <a href="#top" className="hover:text-white">Back to top ↑</a>
            </div>
          </footer>
        </Slide>
      </Deck>
    </div>
  );
}
