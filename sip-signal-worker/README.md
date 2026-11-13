# Sip Signal push worker (Cloudflare, free tier)
1. `cd sip-signal-worker && npm install`
2. `npx wrangler login`
3. `npx wrangler kv namespace create SUBS` -> put the id in wrangler.toml
4. Generate VAPID keys: `npx web-push generate-vapid-keys`
5. `npx wrangler secret put VAPID_PRIVATE_KEY` (paste private key)
   `npx wrangler secret put VAPID_PUBLIC_KEY` (paste public key)
6. Edit `VAPID_SUBJECT` in wrangler.toml to your email.
7. `npx wrangler deploy` -> note the https://sip-signal.<you>.workers.dev URL
8. Put that URL in `WORKER` in sip-signal/index.html, push, and re-add the app / enable reminders on the phone.
