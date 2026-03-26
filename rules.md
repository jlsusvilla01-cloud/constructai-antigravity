# Coding Rules for Antigravity Agent

## Core Rules
- All state lives in the `A` object. Never create separate state stores.
- Always call `render()` after mutating state via `ss({})` helper.
- Use `ss({key: value})` for state updates — this calls `Object.assign(A, u)` then `render()`.
- Never use React, Vue, or any framework. This is vanilla JS only.
- Never add a build step. The app must run by opening `index.html` directly.

## Design System Rules
- Colors: BL=#007AFF, GR=#34C759, OR=#FF9500, RD=#FF3B30, PU=#AF52DE, IN=#5856D6, TE=#5AC8FA, PK=#FF2D55
- Use CSS variables: `var(--bg)`, `var(--card)`, `var(--card2)`, `var(--text)`, `var(--text2)`, `var(--text3)`, `var(--sep)`, `var(--inp)`
- Dark mode is toggled by adding `.dark` class to `#root` — CSS variables handle everything
- Border radius: 14px for cards, 11-12px for inner cards, 9px for inputs, 20px for pills
- Borders: always `0.5px solid var(--sep)`
- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Never hardcode colors outside the palette

## HTML Generation Rules
- All views return HTML strings from functions (LANDING, AUTH, PROJECTS_VIEW, DASHBOARD, MARKET, CLIENT, ADMIN)
- Template literals with backticks for HTML generation
- Inline styles only — no external CSS files
- Use `.card` class for cards, `.c2` for secondary cards, `.rh` for hover rows, `.fade` for animations

## Navigation Rules
- `go(view)` — navigate to a view (landing, auth, projects, dashboard, market, client, admin)
- `goDashDemo()` — jump straight to contractor dashboard with demo data
- Dashboard tabs set via `ss({dashTab: 'tabId'})`
- Portal tabs set via `ss({portalTab: 'tabId'})`

## Adding New Features
1. Add state to the `A` object with sensible defaults
2. Add a new tab entry in the TABS array inside DASHBOARD()
3. Add an `else if(A.dashTab==='newTab')` block in DASHBOARD()
4. Add action functions at the bottom near other actions
5. If adding a new top-level view, add to NAV() vs array and render() switch

## Philippine-Specific Rules
- All amounts in Philippine Peso — always format with `fmt(n)` or `fmtK(n)` helpers
- `fmt(n)` → ₱1,000,000 | `fmtK(n)` → ₱1.00M or ₱1,000k
- Project locations reference Philippine cities
- Regulatory references: CIAP, DOLE, BFP, DPWH, LGU, DENR-EMB
- Payment methods: GCash, Maya (not PayPal, Stripe, etc.)
- SMS provider: Semaphore (not Twilio)

## Security Rules (when adding real backend)
- Never expose PAYMONGO_SECRET_KEY or SUPABASE_SERVICE_KEY in frontend code
- All secret keys go in `.env.local` only (never commit)
- PayMongo webhook must verify signature before processing
- Client portal is read-only — no write access to contractor data
