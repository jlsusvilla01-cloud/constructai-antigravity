# PayMongo Integration Guide

## Setup
1. Sign up at dashboard.paymongo.com
2. Get API keys: pk_test_xxx (public) and sk_test_xxx (secret)
3. Add to .env.local:
   ```
   VITE_PAYMONGO_PUBLIC_KEY=pk_test_xxx
   PAYMONGO_SECRET_KEY=sk_test_xxx
   PAYMONGO_WEBHOOK_SECRET=whsec_xxx
   ```

## Create Payment Link (Vercel Serverless — api/create-payment-link.js)
```js
export default async function handler(req, res) {
  const { billingId, amount, description, clientEmail } = req.body;

  const response = await fetch('https://api.paymongo.com/v1/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64'),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // centavos
          description,
          send_email_receipt: true,
          success_url: `https://yourapp.com/payment-success?billing=${billingId}`,
          cancel_url: `https://yourapp.com/client/portal`,
        }
      }
    })
  });

  const data = await response.json();
  const link = data.data;

  // Save to Supabase
  await supabase.from('billings').update({
    paymongo_link_id: link.id,
    paymongo_checkout_url: link.attributes.checkout_url,
  }).eq('id', billingId);

  return res.status(200).json({ checkoutUrl: link.attributes.checkout_url });
}
```

## Webhook Handler (api/paymongo-webhook.js)
```js
import crypto from 'crypto';

export default async function handler(req, res) {
  // Verify signature
  const sig = req.headers['paymongo-signature'];
  const [t, v1] = sig.split(',');
  const timestamp = t.replace('t=', '');
  const hash = v1.replace('v1=', '');
  const expected = crypto.createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET)
    .update(timestamp + '.' + JSON.stringify(req.body)).digest('hex');

  if (expected !== hash) return res.status(401).end();

  // Handle payment.paid
  const { type, data: payload } = req.body.data.attributes;
  if (type === 'payment.paid' || type === 'link.payment.paid') {
    const linkId = payload.attributes.links?.[0];
    await supabase.from('billings')
      .update({ status: 'Received', paid_at: new Date().toISOString() })
      .eq('paymongo_link_id', linkId);
  }

  return res.status(200).json({ received: true });
}
```

## Fees
- GCash / Maya: 2.0%
- Credit/Debit Card: 3.5% + ₱15
- Bank Transfer: 1.5% (max ₱500)
- Settlement: Next business day

## Test Cards
- 4343434343434345 / 12/25 / 123 → Success
- 4571736000000075 / 12/25 / 123 → Declined
- GCash/Maya test: any 09XXXXXXXXX, OTP: any 6 digits
