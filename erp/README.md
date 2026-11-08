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
- **Billings & payments** — progress billings to the client and the payments received against
  them. Status (unpaid / partly paid / paid / overdue) is computed automatically.
- **Profit**
  - Per project: *projected profit* = contract (incl. approved change orders) − expected final cost
    (the cost budget, or actual cost once spending passes the budget, or actual cost when completed).
    *Cash position* = collected − spent.
  - Company dashboard: collected, spent (incl. overhead) and net profit for this year / last
    12 months / all time; receivables and overdue; month-by-month money in vs. out; alerts for
    projects that are over budget, overdue, heading for a loss or past their target date.

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
`demo@constructai.test` / `demo-password-2026`.

Reset the local database (re-runs migrations + seed): `npx supabase db reset`.

## Put it online

1. Create a **new** Supabase project at supabase.com (the old ConstructAI project has tables
   with the same names and a different shape).
2. Open SQL Editor → paste and run `supabase/migrations/20261108000000_core.sql`.
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
| `src/lib/metrics.ts` | Profit formulas |
