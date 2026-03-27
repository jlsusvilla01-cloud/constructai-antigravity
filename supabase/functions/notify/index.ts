// 🔔 ConstructAI Notifications — Supabase Edge Function
// Location: /supabase/functions/notify/index.ts

import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

serve(async (req) => {
  const { title, message, userId, type } = await req.json()
  
  // 1. OneSignal Push Notification Integration
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: Deno.env.get('ONESIGNAL_APP_ID'),
      include_external_user_ids: [userId],
      contents: { "en": message },
      headings: { "en": title },
      data: { "type": type }
    })
  })

  // 2. Email Notification fallback (via Resend or SendGrid)
  // ...

  return new Response("Notification sent", { status: 200 })
})
