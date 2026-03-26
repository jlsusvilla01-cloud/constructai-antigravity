# ConstructAI PH

> The all-in-one construction management SaaS for Philippine contractors.

## Quick Start

1. Open `index.html` in Chrome — the full app runs instantly
2. Click **"Open Full App — Demo"** on the landing page
3. Navigate using the top nav bar

## Features (18 modules)

| Module | Status |
|---|---|
| Multi-project dashboard | ✅ Built |
| Client progress portal | ✅ Built |
| Cash flow tracker (CIAP 102) | ✅ Built |
| Live materials inventory | ✅ Built |
| Workforce attendance + QR | ✅ Built |
| Equipment tracker | ✅ Built |
| Weather & delay tracker | ✅ Built |
| Permits & regulatory | ✅ Built |
| Punch list | ✅ Built |
| Change orders | ✅ Built |
| BOQ editor | ✅ Built |
| E-signature (R.A. 8792) | ✅ Built |
| GCash/Maya payment flow (mock) | ✅ Built |
| Subcontractor management | ✅ Built |
| Invoice generator | ✅ Built |
| Client approval flow | ✅ Built |
| Market news + price tracker | ✅ Built |
| Contractor marketplace | ✅ Built |
| Feature requests board | ✅ Built |
| Admin panel | ✅ Built |
| Dark / light mode | ✅ Built |

## Next Steps to Go Live

1. **Add Supabase backend** — real database, auth, storage
2. **Wire PayMongo** — real GCash/Maya payments (guide in `paymongo-guide.md`)
3. **Deploy to Vercel** — push to GitHub, connect to Vercel
4. **Add Semaphore SMS** — payment alerts for contractor
5. **Buy domain** — constructai.ph (~₱800/year on Namecheap)

## Pricing Plans

| Plan | Monthly | Annual | Projects |
|---|---|---|---|
| Starter | ₱990 | ₱790 | 3 |
| Pro | ₱2,490 | ₱1,990 | 10 |
| Enterprise | ₱5,990 | ₱4,990 | Unlimited |

## Tech Stack

- **Frontend:** Vanilla JS, single HTML file, no build step
- **Design:** Apple HIG, CSS variables, dark/light mode
- **Backend (planned):** Supabase (PostgreSQL + Auth + Storage)
- **Payments (planned):** PayMongo (GCash, Maya, Cards, Bank Transfer)
- **SMS (planned):** Semaphore Philippines
- **Hosting (planned):** Vercel

## Prompt for Antigravity

To continue building with Antigravity, use prompts like:

```
Add a Supabase backend to this project. Use the existing mock data 
structure in the A object as the database schema. Add auth for 
contractors with email/password login. Keep all existing UI intact.
```

```
Wire up real PayMongo payments to replace the mock payment flow 
in the gcash dashboard tab. Use the Philippine peso amounts already 
in the billings array. Add a Vercel serverless function for the API.
```
