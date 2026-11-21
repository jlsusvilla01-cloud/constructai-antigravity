import { createClient } from "@supabase/supabase-js";

// Supabase pauses free-plan projects after about a week without activity.
// A Vercel cron (see vercel.json) calls this once a day so that never happens.
// It runs one tiny read and returns nothing sensitive.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // When CRON_SECRET is set in Vercel, only Vercel's cron (which sends it) may call this.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  // Any request that reaches the database counts as activity. This one matches no rows.
  const { error } = await supabase.rpc("invitation_preview", {
    invite_token: "00000000-0000-0000-0000-000000000000",
  });

  return Response.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 503 : 200 });
}
