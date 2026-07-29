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
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:8787  

Production:

```bash
npm run build
NODE_ENV=production npm start   # serves dist + /api
```

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
