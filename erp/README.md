# ConstructAI ERP — core

Projects, costs, billings and profit for Philippine contractors.
Next.js (App Router) + Supabase (Postgres, Auth) — deploys to Vercel.

Live: https://constructai-erp.vercel.app (Vercel project `constructai-erp`, Supabase project
"ConstructAI ERP", Singapore). Redeploy with `npx vercel deploy --prod` from this folder.

## What it does

- **Projects** — contract amount, cost budget, client, dates, status.
- **Costs** — materials, labor, subcontractors, equipment, permits, overhead. Costs can belong
  to a project or to the company (overhead).
- **Change orders** — approved ones are added to the contract amount.
- **Billings & payments** — billings to the client and the payments received against them.
  Status (unpaid / partly paid / paid / overdue) is computed automatically. Billing types:
  - *Downpayment* — the advance (project's downpayment %), billed up front.
  - *Progress billing* — enter the cumulative % of work accomplished; the app computes
    gross = contract × % − previous progress billings, withholds **retention** (project's
    retention %, usually 10%) and **recoups the downpayment** in proportion
    (gross × downpayment ÷ contract; the 100% billing recoups whatever is left).
    Net due = gross − retention − recoupment. A live preview shows the computation.
  - *Retention release* — bills retention held by the client (can't exceed what's held).
  - *Other* — a fixed amount.
- **BOQ (bill of quantities)** per project — item no., description, category, unit, qty,
  unit cost. Add lines one by one or paste rows from Excel. "Use as cost budget" sets the
  project budget to the BOQ total. Costs and POs can be charged to a BOQ line, giving budget
  vs. actual (+ committed) per line.
- **Purchasing** — suppliers and purchase orders (numbered PO-0001…, printable).
  Draft → ordered → delivered; *Mark paid* records the PO total as a project cost. Ordered
  and delivered unpaid POs count as **committed cost** (used in projected profit); delivered
  unpaid POs are **payables** to suppliers. A paid PO's items are locked; an owner can undo the
  payment (removes the cost).
- **Team** (Company & team page) — invite people by link (send it by Viber / Messenger / SMS;
  no email needed). They sign up with the invited email and join your company.
  - *Owner*: everything, plus manage the team, rename the company, delete records.
  - *Staff*: view, add and edit records; cannot delete anything (enforced by row-level
    security, not just hidden buttons) or manage the team.
  - A company always keeps at least one owner. People in several companies can switch.
- **Profit**
  - Per project: *projected profit* = contract (incl. approved change orders) − expected final cost
    (the cost budget, or actual cost once spending passes the budget, or actual cost when completed).
    Expected final cost includes committed (unpaid) purchase orders.
    *Cash position* = collected − spent.
  - Company dashboard: collected, spent (incl. overhead) and net profit for this year / last
    12 months / all time; receivables and overdue; month-by-month money in vs. out; alerts for
    projects that are over budget (or will be, with open POs), overdue, heading for a loss,
    past their target date, owe suppliers for delivered POs, or are completed with retention
    still to collect.

Every record belongs to a company (organization). Row-level security makes sure a user only ever
sees their own company's data. A company is created automatically at signup.

## Run it locally

Needs Node 20+ and Docker Desktop (for the local Supabase).

```bash
npm install
npx supabase start          # first run downloads the Supabase images
npx supabase status         # copy API URL + anon key into .env.local
cp .env.example .env.local  # then paste the two values
npm run dev                 # http://localhost:3000
```

The local database is seeded with a demo company (see `supabase/seed.sql`):
`demo@constructai.test` / `demo-password-2026` (owner) and
`staff@constructai.test` / `demo-password-2026` (staff). Santos Residence has a BOQ,
progress billings with retention / downpayment recoupment, and purchase orders.

Reset the local database (re-runs migrations + seed): `npx supabase db reset`.

Database checks (roles, invitations, billing maths, purchasing), local only:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -X -A -t -f supabase/tests/checks.sql
```

Every `T…` / `P…` line should end in `t`.

## Put it online

1. Create a **new** Supabase project at supabase.com (the old ConstructAI project has tables
   with the same names and a different shape).
2. Open SQL Editor → paste and run each file in `supabase/migrations/`, in name order
   (`…_core.sql`, then `…_team.sql`, then `…_contractor_features.sql`). On an existing
   project, run only the ones not applied yet.
   Do **not** run `seed.sql` there — it's demo data for local use only.
3. Authentication → URL Configuration: set Site URL to your Vercel domain.
4. In Vercel, import the repo with **Root Directory = `erp`** and add the two environment
   variables from `.env.example` (Project Settings → API in Supabase).

## Code map

| Path | What |
|---|---|
| `supabase/migrations/` | Tables, row-level security, `project_summary` / `billing_summary` views |
| `src/app/(auth)/` | Login, signup |
| `src/app/(app)/dashboard` | Company dashboard |
| `src/app/(app)/projects` | Project list, new/edit, project detail (overview, costs, billings, change orders) |
| `src/app/(app)/expenses` | All costs incl. overhead, with filters |
| `src/app/(app)/billings` | All billings, collections, record payments |
| `src/app/actions/` | Server actions (all writes go through these) |
| `src/app/(app)/purchasing` | Purchase orders (list, new, detail/print, edit) and suppliers |
| `src/app/(app)/settings` | Company & team: members, roles, invitation links, switch company |
| `src/app/(auth)/invite/[token]` | Accept an invitation (sign up or log in) |
| `src/lib/metrics.ts` | Profit formulas |
| `src/lib/billing.ts` | Progress billing / retention / recoupment maths |
| `supabase/tests/checks.sql` | Database checks (run locally with psql) |
