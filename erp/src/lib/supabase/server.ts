import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createDemoClient } from "@/lib/demo/client";
import { DEMO_MODE } from "@/lib/demo/mode";

export async function createClient() {
  if (DEMO_MODE) return createDemoClient();

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
