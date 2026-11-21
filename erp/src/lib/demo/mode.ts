/**
 * Demo mode: NEXT_PUBLIC_DEMO_MODE=1 at build time. The whole deployment then runs
 * on the built-in demo company (src/lib/demo/snapshot.json), read-only, with no
 * login and no database. Used while the hosted Supabase project is paused.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
