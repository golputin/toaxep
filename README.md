# OpenAgent — Vercel (frontend) + VPS (API only)

## Architecture

```
Browser  →  Vercel (static UI)
                │
                │  fetch(VITE_API_BASE + '/api/chat')
                ▼
         VPS :8787  (Express API only — keys, credits, LLM proxy)
```

**Do not** host the SPA on the VPS. **Do not** put `LLM_API_KEY` in Vercel.

## 1) VPS — API only

```bash
cd /root/openagent   # or clone repo
cp .env.example .env # set LLM_API_KEY, ALLOWED_ORIGINS
npm install --omit=dev
pm2 start server/index.js --name openagent-api
pm2 save
```

Health check:

```bash
curl http://127.0.0.1:8787/api/health
curl http://YOUR_VPS_IP:8787/api/health
```

Open firewall **TCP 8787** (or put nginx/caddy TLS in front on 443).

### Env (VPS `.env`)

| Key | Meaning |
|-----|---------|
| `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` | OpenAI-compatible upstream |
| `PORT` | default `8787` |
| `ALLOWED_ORIGINS` | e.g. `https://your-app.vercel.app,https://*.vercel.app` |
| `SERVE_STATIC` | leave `0` / unset |
| `DAILY_FREE_CREDITS` | default 10 |

## Vercel frontend (blockearn.vercel.app / any project)

`vercel.json` **rewrites** browser calls:

```
Browser POST /api/chat  →  Vercel proxy  →  http://VPS:8787/api/chat
```

So the UI can keep using **relative** `/api/...` (no mixed-content, no CORS pain).

After pulling latest `main`, **Redeploy** on Vercel (Deployments → … → Redeploy).  
Until redeploy, old `vercel.json` still serves `index.html` for POST → **405**.

Optional override (skip proxy):

```
VITE_API_BASE=https://your-api-domain.com
```

## VPS API

```bash
pm2 status openagent-api
curl http://104.245.34.139:8787/api/health
```

## 3) CORS

VPS must allow your Vercel origin. Default allows `https://*.vercel.app` and localhost.

If you use a custom domain on Vercel, add it:

```
ALLOWED_ORIGINS=https://app.yourdomain.com,https://*.vercel.app
```

Then `pm2 restart openagent-api`.

## Local dev (optional)

```bash
npm run dev
# web :5173 proxies /api → :8787 — leave VITE_API_BASE empty
```

## Brand

- Token mark **$OAGT** — `public/token-oagt.svg`
