# OpenAgent

Wallet-gated AI chat inspired by [Opentroy](https://app.opentroy.org/) — **not affiliated**.

```
Connect wallet → free daily credits → chat with agents → buy more credits (RH ETH rail)
```

## Features

| | |
|--|--|
| Wallet gate | `window.ethereum` or paste `0x` address |
| Credits | **10 free / UTC day** + purchased balance |
| Agents | General, research, code review, crypto, DeFi, SQL, email, image-prompt |
| Cost | 1–6 credits / message by agent weight |
| Shop | Demo top-up on **Robinhood Chain (4663)** rate table |
| API | Express proxy → OpenAI-compatible LLM (server-side key only) |

## Quick start

```bash
cp .env.example .env   # set LLM_API_KEY
npm install
npm run dev            # API :8787 + Vite :5173 (BOTH required)
```

- Web: http://localhost:5173  
- API: http://localhost:8787  

**HTTP 404 on chat?** Almost always means only the static UI is running (no API / no proxy). Fix:

```bash
npm run dev            # recommended
# or single process:
npm run serve          # build + API serves dist on :8787
```

Do **not** open `dist/index.html` as a file, and do not run bare `vite preview` without API (use `npm run preview` which starts both).

Production:

```bash
npm run build
npm start              # serves dist + /api on PORT (default 8787)
```

## Brand

- Token mark: **$OAGT** (`public/token-oagt.svg`) — product credit branding  
- Mesh background + lime glow UI (not flat black)

## Env

See `.env.example`:

- `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL`
- `DAILY_FREE_CREDITS` (default 10)
- `RH_CHAIN_ID`, `TREASURY`, `CREDITS_PER_ETH`
- `ALLOW_DEMO_TOPUP=1` for local credit grants without chain verify

**Never commit `.env`.**

## Stack

Vite (static UI) · Express · local JSON credit ledger (`data/`) · any OpenAI-compatible chat API

## GitHub

Replaces previous FarmTown / BlockEarn content on this repo.
