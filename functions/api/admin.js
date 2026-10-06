// GET  /api/admin            -> every bounty code with counts, PayPal email and dollars owed
// POST /api/admin  { code }  -> records that you've paid that code one dollar
// Both need the header  x-admin-key: <ADMIN_KEY>.  Requires KV bound as BOUNTY and secret ADMIN_KEY.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function authorised(request, env) {
  const given = request.headers.get('x-admin-key') || '';
  const want = env.ADMIN_KEY || '';
  if (!want || given.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

const owed = (rec) => Math.max(0, Math.floor(rec.count / 5) - rec.paid);

export async function onRequestGet({ request, env }) {
  if (!authorised(request, env)) return json({ error: 'Wrong password' }, 401);

  const rows = [];
  let cursor;
  do {
    const page = await env.BOUNTY.list({ prefix: 'ref:', cursor });
    for (const k of page.keys) {
      const rec = await env.BOUNTY.get(k.name, 'json');
      if (rec) rows.push({ code: k.name.slice(4), ...rec, owed: owed(rec) });
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  rows.sort((a, b) => b.owed - a.owed || b.count - a.count);
  return json({ rows });
}

export async function onRequestPost({ request, env }) {
  if (!authorised(request, env)) return json({ error: 'Wrong password' }, 401);

  let code = '';
  try { code = String((await request.json()).code || ''); } catch { /* fall through */ }
  const key = 'ref:' + code.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const rec = await env.BOUNTY.get(key, 'json');
  if (!rec) return json({ error: 'Unknown code' }, 404);
  if (owed(rec) < 1) return json({ error: 'Nothing owed' }, 409);

  rec.paid += 1;
  rec.lastPaid = new Date().toISOString();
  await env.BOUNTY.put(key, JSON.stringify(rec));
  return json({ ok: true, owed: owed(rec) });
}
