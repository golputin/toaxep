# HoodAgent — Vercel (frontend) + VPS (API only)

## Live product

- **Name:** HoodAgent  
- **Credits:** `$HOOD`  
- **Top-up:** native ETH on **Robinhood Chain (4663)** → treasury, verified via RPC  
- **Demo top-up:** off (`ALLOW_DEMO_TOPUP=0`)

## Routes

| URL | What |
|-----|------|
| `/` | Marketing landing |
| `/app` | Live chat desk |
| `app.*` host | Forces app shell |

## Architecture

```
Browser  →  Vercel (static UI)
                │  /api/* rewrite
                ▼
         VPS :8787  (Express — keys, credits, LLM, top-up verify)
```

## VPS API

```bash
cd /root/openagent
# .env: LLM_*, TREASURY, ALLOW_DEMO_TOPUP=0, RH_RPC
pm2 restart hoodagent-api   # or openagent-api if not renamed yet
curl http://127.0.0.1:8787/api/health
curl http://127.0.0.1:8787/api/shop
```

### Top-up flow

1. User connects wallet (extension).  
2. Clicks pack → `eth_sendTransaction` to `TREASURY` on chain 4663.  
3. Frontend POSTs `/api/credits/verify` with `txHash`.  
4. API checks receipt: success, from=wallet, to=treasury, native value ≥ pack.  
5. Credits granted from **on-chain value** (tx cannot be reused).

Manual claim: paste tx hash on Buy Credits page.

## Vercel

`vercel.json` rewrites `/api/*` → VPS. Redeploy after pull.

Optional:

```
VITE_APP_URL=https://app.yourdomain.com
```

## Brand

- Mark: `public/token-hood.svg` (`$HOOD`)
