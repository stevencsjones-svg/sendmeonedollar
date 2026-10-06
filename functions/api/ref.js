// POST /api/ref  { name, paypal }  -> { code }   Creates a bounty code. The PayPal email is stored, never returned.
// GET  /api/ref?code=xyz           -> { code, count, paid }   Public progress check for a code.
// Requires a KV namespace bound as BOUNTY.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const slug = (s) =>
  String(s || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 24);

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const name = String(body.name || '').trim().slice(0, 40);
  const paypal = String(body.paypal || '').trim().toLowerCase().slice(0, 254);
  const base = slug(name);
  if (!base) return json({ error: 'Type a name first.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal)) return json({ error: 'That PayPal email looks wrong.' }, 400);

  let code = null;
  for (let i = 0; i < 5 && !code; i++) {
    const candidate = base + '-' + Math.random().toString(36).slice(2, 6).padEnd(4, '0');
    if (!(await env.BOUNTY.get('ref:' + candidate))) code = candidate;
  }
  if (!code) return json({ error: 'Something went wrong. Try again.' }, 500);

  await env.BOUNTY.put('ref:' + code, JSON.stringify({
    name, paypal, count: 0, paid: 0, created: new Date().toISOString(),
  }));
  return json({ code });
}

export async function onRequestGet({ request, env }) {
  const code = String(new URL(request.url).searchParams.get('code') || '')
    .toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const rec = code ? await env.BOUNTY.get('ref:' + code, 'json') : null;
  if (!rec) return json({ error: 'Unknown code' }, 404);
  return json({ code, count: rec.count, paid: rec.paid });
}
