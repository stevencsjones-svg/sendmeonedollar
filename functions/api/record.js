// POST /api/record  { orderID }
// Called by the page after a PayPal payment. Looks the order up with PayPal directly (so it can't be faked),
// and if it's a completed $1+ payment tagged with a bounty code, adds one to that code's count.
// Each order is only ever counted once.
//
// Requires: KV namespace bound as BOUNTY; secret PAYPAL_CLIENT_SECRET.
// Optional: PAYPAL_CLIENT_ID (defaults to the live client ID already public in index.html).

const PAYPAL_API = 'https://api-m.paypal.com';
const DEFAULT_CLIENT_ID =
  'AXWeUeNiGnGt6i3UkSImVHYO14dZbk3XVyM79uq9GH92ZseT2XLonzVj_6VhpnepJfCLUgOHCCrm-fJi';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  let orderID = '';
  try { orderID = String((await request.json()).orderID || ''); } catch { /* fall through */ }
  if (!/^[A-Z0-9]{10,30}$/.test(orderID)) return json({ error: 'Bad order ID' }, 400);

  if (await env.BOUNTY.get('order:' + orderID)) return json({ ok: true, duplicate: true });

  const clientId = env.PAYPAL_CLIENT_ID || DEFAULT_CLIENT_ID;
  const tokenRes = await fetch(PAYPAL_API + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + btoa(clientId + ':' + env.PAYPAL_CLIENT_SECRET),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) return json({ error: 'PayPal auth failed' }, 502);
  const { access_token } = await tokenRes.json();

  const orderRes = await fetch(PAYPAL_API + '/v2/checkout/orders/' + orderID, {
    headers: { authorization: 'Bearer ' + access_token },
  });
  if (!orderRes.ok) return json({ error: 'Order not found' }, 404);
  const order = await orderRes.json();
  if (order.status !== 'COMPLETED') return json({ error: 'Order not completed' }, 409);

  const unit = (order.purchase_units || [])[0] || {};
  const amount = unit.amount || {};
  const match = /^ref:([a-z0-9-]{1,40})$/.exec(unit.custom_id || '');
  const ref = match && amount.currency_code === 'USD' && Number(amount.value) >= 1 ? match[1] : null;

  // Remember the order whether or not it had a ref, so it's never looked up or counted twice.
  await env.BOUNTY.put('order:' + orderID, ref || '-');
  if (!ref) return json({ ok: true, ref: null });

  const key = 'ref:' + ref;
  const rec = await env.BOUNTY.get(key, 'json');
  if (!rec) return json({ ok: true, ref: null });
  rec.count += 1;
  rec.last = new Date().toISOString();
  await env.BOUNTY.put(key, JSON.stringify(rec));
  return json({ ok: true, ref, count: rec.count });
}
