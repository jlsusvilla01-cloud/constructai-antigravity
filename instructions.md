# ConstructAI PH — Project Instructions for Antigravity

## What This Project Is
ConstructAI PH is a full-featured SaaS construction management platform built for Philippine contractors. It includes:
- Multi-project dashboard
- Client progress portal
- Cash flow & billing tracker (CIAP 102)
- Live materials inventory
- Workforce & QR attendance
- Equipment tracker with maintenance log
- Weather & delay tracker (PAGASA)
- Permits & regulatory compliance
- Change orders & punch list
- E-signature (R.A. 8792)
- GCash/Maya/PayMongo payment flow
- Subcontractor management
- Invoice generator
- Client approval flow
- Contractor marketplace
- Construction market news feed (PSA data)
- Feature request board
- Dark/light mode
- Admin panel (FAQ editor, testimonials manager)

## Current Tech Stack
- Single-file HTML app: `index.html` (vanilla JS, no framework, no build step)
- All state managed in a single `A` object with a `render()` function
- Apple HIG-inspired design system using CSS variables
- Fully functional offline — no API calls yet (mock data)

## File Structure
```
constructai-antigravity/
  index.html          ← The entire app (open this in browser to preview)
  instructions.md     ← This file
  rules.md            ← Coding rules for the agent
  README.md           ← Project overview
```

## How to Preview
Open `index.html` directly in Chrome — the full app runs instantly, no build step needed.

## What to Build Next (Priority Order)
1. **Supabase backend** — replace mock data with real database
2. **Authentication** — contractor login/signup with Supabase Auth
3. **PayMongo integration** — real GCash/Maya payment processing
4. **SMS notifications** — Semaphore API for payment alerts
5. **File uploads** — site photos, permit documents via Supabase Storage
6. **Multi-user** — team members per contractor account

## Philippine Context
- Currency: Philippine Peso (₱)
- Regulations: CIAP Document 102, DOLE R.A. 11058, Civil Code Art. 1723
- Payment: GCash, Maya, BDO, BPI, InstaPay via PayMongo
- Weather: PAGASA
- Material prices: PSA CMWPI NCR data
- SMS: Semaphore or Vonage Philippines
