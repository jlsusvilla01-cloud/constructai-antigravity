import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // Verify PayMongo webhook signature
  const sig = req.headers['paymongo-signature'];
  if (!sig) return res.status(401).json({ error: 'Missing signature' });

  const parts = sig.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const hash = parts['v1'];

  const expected = crypto
    .createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET)
    .update(timestamp + '.' + JSON.stringify(req.body))
    .digest('hex');

  if (expected !== hash) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Handle payment events
  const event = req.body?.data?.attributes;
  if (!event) return res.status(400).json({ error: 'Invalid payload' });

  const { type, data: payload } = event;

  if (type === 'payment.paid' || type === 'link.payment.paid') {
    const linkId = payload?.attributes?.links?.[0];

    if (linkId) {
      const { error } = await supabase
        .from('billings')
        .update({ status: 'Received', paid_at: new Date().toISOString() })
        .eq('paymongo_link_id', linkId);

      if (error) {
        console.error('Supabase update error:', error);
        return res.status(500).json({ error: 'DB update failed' });
      }
    }
  }

  return res.status(200).json({ received: true });
}
