import { buildPushPayload } from '@block65/webcrypto-web-push';

const HOURS = [8, 10, 12, 14, 16];
const cors = env => ({
  'access-control-allow-origin': env.ALLOWED_ORIGIN,
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
});
const id = async ep => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ep)))].map(b => b.toString(16).padStart(2, '0')).join('');
const local = tz => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
};

export default {
  async fetch(req, env) {
    const h = cors(env), url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: h });
    if (url.pathname === '/vapid') return new Response(env.VAPID_PUBLIC_KEY, { headers: h });
    if (url.pathname === '/subscribe' && req.method === 'POST') {
      const b = await req.json();
      if (!b.subscription?.endpoint?.startsWith('https://')) return new Response('bad', { status: 400, headers: h });
      const { subscription, tz, goalMl, loggedMl, date, unit } = b;
      await env.SUBS.put(await id(subscription.endpoint), JSON.stringify({ subscription, tz, goalMl, loggedMl, date, unit }));
      return new Response('ok', { headers: h });
    }
    return new Response('Sip Signal', { headers: h });
  },

  async scheduled(_evt, env) {
    const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
    let cursor;
    do {
      const page = await env.SUBS.list({ cursor });
      cursor = page.list_complete ? undefined : page.cursor;
      for (const k of page.keys) {
        const u = JSON.parse(await env.SUBS.get(k.name) || 'null');
        if (!u) continue;
        const now = local(u.tz || 'UTC');
        if (!HOURS.includes(now.hour)) continue;
        const logged = u.date === now.date ? u.loggedMl : 0;
        const left = u.goalMl - logged;
        if (left <= 0) continue;
        const amt = u.unit === 'oz' ? `${Math.round(left / 29.5735)} oz` : `${Math.round(left)} ml`;
        const payload = await buildPushPayload({ data: JSON.stringify({ title: 'Sip Signal 💧', body: `Time to drink! ${amt} left to hit your goal by 5 pm.` }), options: { ttl: 3600 } }, u.subscription, vapid);
        const r = await fetch(u.subscription.endpoint, payload);
        if (r.status === 404 || r.status === 410) await env.SUBS.delete(k.name);
      }
    } while (cursor);
  },
};
