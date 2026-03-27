// 💰 ConstructAI Affiliate Payouts — Supabase Edge Function
// Location: /supabase/functions/payouts/index.ts

import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { referralCode, amount, eventType } = await req.json()
  
  if (eventType !== 'subscription.paid') return new Response("Skipping non-payment event", { status: 200 })

  // 1. Find the partner associated with the referral code
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, paymongo_id, email')
    .eq('referral_code', referralCode)
    .single()

  if (error || !partner) return new Response("Partner not found", { status: 404 })

  // 2. Calculate 20% commission
  const commission = amount * 0.20

  // 3. Trigger PayMongo Disbursement (Mock logic)
  // In a real app, you would call: fetch('https://api.paymongo.com/v1/disbursements', ...)
  const res = await fetch('https://api.paymongo.com/v1/disbursements', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(Deno.env.get('PAYMONGO_SECRET_KEY') + ':')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(commission * 100), // convert to centavos
          recipient_id: partner.paymongo_id,
          currency: 'PHP',
          description: `Affiliate commission for referral: ${referralCode}`
        }
      }
    })
  })

  // 4. Log the payout in public.payout_logs
  await supabase.from('payout_logs').insert({
    partner_id: partner.id,
    amount: commission,
    status: res.ok ? 'Success' : 'Failed'
  })

  return new Response("Payout processed", { status: 200 })
})
