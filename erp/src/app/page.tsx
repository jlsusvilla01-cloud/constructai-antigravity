import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { DEMO_MODE } from "@/lib/demo/mode";

export const metadata: Metadata = {
  title: { absolute: "ConstructAI — Profit, billing and costs for Philippine contractors" },
  description:
    "See if every project is making money. Track contracts, costs, progress billings with retention, collections, BOQ and purchase orders in one place.",
};

/* ─── Small building blocks ─────────────────────────────────────────────── */

function Cta({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong"
          : "inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
      }
    >
      {children}
    </Link>
  );
}

function PrimaryActions({ big = false }: { big?: boolean }) {
  return DEMO_MODE ? (
    <div className="flex flex-wrap gap-3">
      <Cta href="/dashboard">Try the live demo</Cta>
      {big && (
        <Cta href="#features" variant="ghost">
          See what it does
        </Cta>
      )}
    </div>
  ) : (
    <div className="flex flex-wrap gap-3">
      <Cta href="/signup">Create your company account</Cta>
      <Cta href="/login" variant="ghost">
        Log in
      </Cta>
    </div>
  );
}

const icon = "h-5 w-5";
const Icons = {
  profit: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 10h6M9 14h6M9 18h3" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9.5v5M17 9.5v5" />
    </svg>
  ),
  boq: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14h18M9 4v16" />
    </svg>
  ),
  po: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7l9-4 9 4-9 4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16.5 14.2c2.3.3 3.9 1.8 4.5 4.3" />
    </svg>
  ),
};

/* ─── Product preview (hero) ─────────────────────────────────────────────── */

function Meter({ value, tone = "brand" }: { value: number; tone?: "brand" | "warn" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className={tone === "warn" ? "h-full rounded-full bg-warn" : "h-full rounded-full bg-brand"} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function ProductPreview() {
  const rows: [string, string, boolean?][] = [
    ["Work accomplished to date (60%)", "₱2,601,000"],
    ["Less work already billed", "− ₱1,734,000"],
    ["This billing (gross)", "₱867,000", true],
    ["Less retention (10%)", "− ₱86,700"],
    ["Less downpayment recoupment", "− ₱127,500"],
  ];
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/15 via-brand-soft to-transparent blur-2xl" />
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-brand/5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Santos Residence</p>
            <p className="truncate text-xs text-muted">Maria Santos · BGC, Taguig</p>
          </div>
          <span className="shrink-0 rounded-full bg-gain-soft px-2 py-0.5 text-xs font-medium text-gain">Active</span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Contract", "₱4,335,000", "text-ink"],
            ["Spent", "₱1,198,500", "text-ink"],
            ["Projected profit", "₱685,000", "text-gain"],
          ].map(([label, value, tone]) => (
            <div key={label} className="min-w-0 rounded-lg bg-canvas px-2.5 py-2">
              <dt className="truncate text-[11px] text-muted">{label}</dt>
              <dd className={`truncate text-sm font-semibold tabular-nums ${tone}`}>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted">
              <span>Budget used</span>
              <span className="tabular-nums">33%</span>
            </div>
            <Meter value={33} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted">
              <span>Contract billed</span>
              <span className="tabular-nums">45%</span>
            </div>
            <Meter value={45} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-canvas/70 p-3">
          <p className="mb-1.5 text-xs font-semibold text-ink">Progress billing #3</p>
          {rows.map(([label, value, strong]) => (
            <div key={label} className={`flex justify-between gap-3 py-0.5 text-[11px] ${strong ? "font-medium text-ink" : "text-muted"}`}>
              <span className="truncate">{label}</span>
              <span className="shrink-0 tabular-nums">{value}</span>
            </div>
          ))}
          <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 text-xs font-semibold text-ink">
            <span>Net amount due</span>
            <span className="tabular-nums">₱652,800.00</span>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden rounded-xl border border-line bg-surface px-3 py-2 shadow-lg sm:block">
        <p className="text-[11px] text-muted">Needs attention</p>
        <p className="text-xs font-semibold text-loss">₱2,100,000 overdue from client</p>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Icons.profit,
    title: "Profit per project, before it’s too late",
    body: "Contract plus approved change orders, minus the cost you expect to finish. You see the margin while there is still time to act, not after turnover.",
  },
  {
    icon: Icons.billing,
    title: "Progress billing the Philippine way",
    body: "Bill by % of work accomplished. Retention and downpayment recoupment are computed for you, and work already billed is never charged twice.",
  },
  {
    icon: Icons.cash,
    title: "Collections and cash position",
    body: "What each client still owes, what’s overdue, and whether client payments cover your costs or you’re funding the job from your own pocket.",
  },
  {
    icon: Icons.boq,
    title: "BOQ, budget vs. actual",
    body: "Paste your bill of quantities from Excel. Charge costs to a line and see which items are running over, line by line.",
  },
  {
    icon: Icons.po,
    title: "Purchase orders and suppliers",
    body: "Numbered, printable POs. Ordered materials count as committed cost right away, so the profit figure isn’t too rosy.",
  },
  {
    icon: Icons.team,
    title: "Your team, with the right access",
    body: "Invite your engineer or bookkeeper with a link. Staff can record costs and billings; only owners can delete or manage the team.",
  },
];

const STEPS = [
  ["Set up the project", "Contract amount, cost budget or BOQ, retention and downpayment terms."],
  ["Record costs as they happen", "Materials, labor, subcontractors, equipment, and POs from your suppliers."],
  ["Bill progress and collect", "Enter % accomplished, send the billing, record payments by cash, check, bank, GCash or Maya."],
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-surface">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="ConstructAI home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <a href="#features" className="hidden rounded-md px-3 py-2 font-medium text-muted hover:text-ink sm:inline-block">
              Features
            </a>
            <a href="#how" className="hidden rounded-md px-3 py-2 font-medium text-muted hover:text-ink sm:inline-block">
              How it works
            </a>
            {DEMO_MODE ? (
              <Link href="/dashboard" className="rounded-lg bg-brand px-3.5 py-2 font-semibold text-white hover:bg-brand-strong">
                Try the demo
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-3 py-2 font-medium text-muted hover:text-ink">
                  Log in
                </Link>
                <Link href="/signup" className="rounded-lg bg-brand px-3.5 py-2 font-semibold text-white hover:bg-brand-strong">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
                For Philippine contractors
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Know if every project is <span className="text-brand">still making money</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                ConstructAI keeps your contracts, costs, progress billings and collections in one place, and shows the projected
                profit of each job while there’s still time to fix it.
              </p>
              <div className="mt-8">
                <PrimaryActions big />
              </div>
              {DEMO_MODE && (
                <p className="mt-3 text-xs text-faint">No sign-up needed. Explore a sample contractor with four projects.</p>
              )}
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">Spreadsheets show what you spent.</h2>
              <p className="mt-2 text-muted">Not whether the job will still make money when it’s done.</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3 md:col-span-2">
              {[
                ["Costs creep up quietly", "Materials and labor go over budget long before the final billing shows it."],
                ["Billing math eats your time", "Retention, downpayment recoupment and change orders, redone by hand every month."],
                ["Collections slip", "Overdue billings hide in group chats while you pay suppliers out of pocket."],
              ].map(([t, b]) => (
                <li key={t} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-sm font-semibold text-ink">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Everything a growing contractor tracks</h2>
              <p className="mt-3 text-muted sm:text-lg">From the first downpayment to the release of retention.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-md">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">{f.icon}</span>
                  <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-line bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">How it works</h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map(([t, b], i) => (
                <li key={t} className="relative rounded-2xl border border-line bg-surface p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-semibold text-ink">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-3xl text-sm text-muted">
              Amounts are in pesos, and dates and terms follow how construction contracts are written here. Each company’s data is
              kept separate and private to its own team.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="rounded-3xl bg-ink px-6 py-12 text-center sm:px-12">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {DEMO_MODE ? "See it with real-looking numbers" : "Start with your current projects"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/70">
                {DEMO_MODE
                  ? "Open the demo company, click through a project, and try computing a progress billing."
                  : "Add a project in a minute. Your team can join with an invitation link."}
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href={DEMO_MODE ? "/dashboard" : "/signup"}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-ink hover:bg-brand-soft"
                >
                  {DEMO_MODE ? "Open the demo" : "Create your company account"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} ConstructAI · Made for contractors in the Philippines</p>
        </div>
      </footer>
    </div>
  );
}
