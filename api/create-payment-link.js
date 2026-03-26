import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { billingId, billingRef, amount, description, clientEmail } = req.body;

  if (!amount || !description) {
    return res.status(400).json({ error: 'amount and description are required' });
  }

  // Create PayMongo payment link
  const pmRes = await fetch('https://api.paymongo.com/v1/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' +
        Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64'),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // centavos
          description,
          send_email_receipt: !!clientEmail,
          success_url: `${process.env.APP_URL || 'https://constructai.ph'}/payment-success`,
          cancel_url: `${process.env.APP_URL || 'https://constructai.ph'}`,
        },
      },
    }),
  });

  if (!pmRes.ok) {
    const err = await pmRes.json();
    return res.status(502).json({ error: 'PayMongo error', detail: err });
  }

  const pmData = await pmRes.json();
  const link = pmData.data;
  const checkoutUrl = link.attributes.checkout_url;
  const linkId = link.id;

  // Persist to Supabase (by billingId UUID or billingRef string)
  if (billingId) {
    await supabase
      .from('billings')
      .update({ paymongo_link_id: linkId, paymongo_checkout_url: checkoutUrl, status: 'Sent' })
      .eq('id', billingId);
  } else if (billingRef) {
    await supabase
      .from('billings')
      .update({ paymongo_link_id: linkId, paymongo_checkout_url: checkoutUrl, status: 'Sent' })
      .eq('ref', billingRef);
  }

  return res.status(200).json({ checkoutUrl, linkId });
}
