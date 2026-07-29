/**
 * OpenAgent API — chat proxy + wallet credits ledger
 * Inspired by Opentroy: wallet gate, daily free credits, paid top-up rail (RH)
 */
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Always load .env from project root (fixes 404/misconfig when cwd ≠ ROOT)
dotenv.config({ path: path.join(ROOT, ".env") });
dotenv.config({ path: path.join(ROOT, ".env.local") });

const DATA = path.join(ROOT, "data");
const LEDGER = path.join(DATA, "credits.json");

const PORT = Number(process.env.PORT || 8787);
const DAILY = Number(process.env.DAILY_FREE_CREDITS || 10);
const LLM_URL = (process.env.LLM_API_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
const LLM_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "z-ai/glm-5.2";
const RH_CHAIN_ID = Number(process.env.RH_CHAIN_ID || 4663);
const TREASURY = process.env.TREASURY || "0x0000000000000000000000000000000000000000";
const CREDITS_PER_ETH = Number(process.env.CREDITS_PER_ETH || 100000);
const MIN_TOPUP_ETH = Number(process.env.MIN_TOPUP_ETH || 0.005);
const SERVE_STATIC = process.env.SERVE_STATIC === "1" || process.env.NODE_ENV === "production";

fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(LEDGER)) fs.writeFileSync(LEDGER, "{}");

function loadLedger() {
  try {
    return JSON.parse(fs.readFileSync(LEDGER, "utf8") || "{}");
  } catch {
    return {};
  }
}
function saveLedger(l) {
  fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2));
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function normAddr(a) {
  if (!a || typeof a !== "string") return null;
  const s = a.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(s)) return null;
  return s;
}

function ensureUser(ledger, addr) {
  const day = dayKey();
  if (!ledger[addr]) {
    ledger[addr] = {
      purchased: 0,
      dailyUsed: 0,
      dailyDay: day,
      threads: {},
      topups: [],
    };
  }
  const u = ledger[addr];
  if (u.dailyDay !== day) {
    u.dailyDay = day;
    u.dailyUsed = 0;
  }
  return u;
}

function balanceOf(u) {
  const freeLeft = Math.max(0, DAILY - (u.dailyUsed || 0));
  const purchased = Math.max(0, u.purchased || 0);
  return {
    freeLeft,
    purchased,
    remaining: freeLeft + purchased,
    dailyLimit: DAILY,
    dailyUsed: u.dailyUsed || 0,
  };
}

function spend(u, cost) {
  const b = balanceOf(u);
  if (b.remaining < cost) return false;
  let left = cost;
  const freeUse = Math.min(left, b.freeLeft);
  u.dailyUsed = (u.dailyUsed || 0) + freeUse;
  left -= freeUse;
  if (left > 0) u.purchased = Math.max(0, (u.purchased || 0) - left);
  return true;
}

const COST = {
  standard: 1,
  "troy-standard": 1,
  hermes: 1,
  tools: 3,
  "web-search": 3,
  "image-generator": 6,
  "troy-pro": 2,
  code: 2,
  research: 3,
  defi: 3,
  scrape: 3,
};

const AGENTS = [
  {
    id: "general",
    name: "General Assistant",
    blurb: "Default all-purpose chat",
    icon: "✦",
    mode: "standard",
    system: "You are OpenAgent, a sharp helpful assistant. Be concise and useful.",
  },
  {
    id: "web-research",
    name: "Web Research",
    blurb: "Structured research briefs",
    icon: "🔎",
    mode: "research",
    system:
      "You are a research agent. Structure answers with bullet findings and clear next steps. Be skeptical of weak claims.",
  },
  {
    id: "code-review",
    name: "Code Review",
    blurb: "Security + clarity review",
    icon: "🧪",
    mode: "code",
    system:
      "You are a senior code reviewer. Flag bugs, security issues, and suggest minimal patches. Use markdown code blocks.",
  },
  {
    id: "crypto-tracker",
    name: "Crypto Tracker",
    blurb: "Markets, on-chain intuition",
    icon: "📈",
    mode: "defi",
    system:
      "You are a crypto markets assistant. Be blunt about risk. Never invent prices — say when data is unavailable.",
  },
  {
    id: "defi-analyzer",
    name: "DeFi Analyzer",
    blurb: "Protocols, APY skepticism",
    icon: "🏦",
    mode: "defi",
    system:
      "You analyze DeFi designs. Point out rug vectors, emission math, and claim-vs-reality gaps.",
  },
  {
    id: "sql-builder",
    name: "SQL Builder",
    blurb: "Queries + schema tips",
    icon: "🗃️",
    mode: "code",
    system: "You write clean SQL and explain indexes. Prefer portable SQL.",
  },
  {
    id: "email-drafter",
    name: "Email Drafter",
    blurb: "Tight professional copy",
    icon: "✉️",
    mode: "standard",
    system: "Draft clear emails. Offer 2 tones when useful: direct and warm.",
  },
  {
    id: "image-prompt",
    name: "Image Prompt Smith",
    blurb: "High-cost creative prompts",
    icon: "🎨",
    mode: "image-generator",
    system:
      "You craft detailed image-generation prompts (subject, style, lighting, camera). Output ready-to-paste prompts.",
  },
];

const app = express();
app.use(cors({ origin: true, exposedHeaders: ["X-Credits-Remaining", "X-Daily-Limit", "X-Purchased-Credits", "X-Credit-Cost"] }));
app.use(express.json({ limit: "1mb" }));

function walletFrom(req) {
  return normAddr(req.headers["x-wallet-address"] || req.body?.walletAddress || req.query?.wallet);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "openagent",
    model: LLM_MODEL,
    llmConfigured: Boolean(LLM_KEY),
    chainId: RH_CHAIN_ID,
    dailyFree: DAILY,
    token: { symbol: "OAGT", name: "OpenAgent" },
  });
});

app.get("/api/agents", (_req, res) => {
  res.json({
    agents: AGENTS.map(({ id, name, blurb, icon, mode }) => ({
      id,
      name,
      blurb,
      icon,
      mode,
      creditCost: COST[mode] || 1,
    })),
  });
});

app.get("/api/v1/credits", (req, res) => {
  const addr = walletFrom(req);
  if (!addr) {
    return res.status(401).json({
      error: { code: "unauthorized", message: "Connect your wallet to view credits." },
    });
  }
  const ledger = loadLedger();
  const u = ensureUser(ledger, addr);
  saveLedger(ledger);
  const b = balanceOf(u);
  res.json({
    credits_remaining: b.remaining,
    credits_used: b.dailyUsed,
    daily_limit: b.dailyLimit,
    purchased_credits: b.purchased,
    free_left: b.freeLeft,
    resets_at: new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0)
    ).toISOString(),
  });
});

app.post("/api/credits/verify", (req, res) => {
  const addr = walletFrom(req);
  if (!addr) {
    return res.status(401).json({
      error: { code: "unauthorized", message: "Connect wallet first." },
    });
  }
  const eth = Number(req.body?.ethAmount || 0);
  const txHash = String(req.body?.txHash || "").trim();
  if (!Number.isFinite(eth) || eth < MIN_TOPUP_ETH) {
    return res.status(400).json({
      error: { code: "validation_error", message: `Minimum top-up is ${MIN_TOPUP_ETH} ETH` },
    });
  }
  const demo = !txHash || txHash.startsWith("demo:") || process.env.ALLOW_DEMO_TOPUP === "1";
  if (!demo && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return res.status(400).json({
      error: { code: "validation_error", message: "Invalid tx hash" },
    });
  }

  const grant = Math.floor(eth * CREDITS_PER_ETH);
  const ledger = loadLedger();
  const u = ensureUser(ledger, addr);
  u.purchased = (u.purchased || 0) + grant;
  u.topups.push({
    at: new Date().toISOString(),
    eth,
    grant,
    txHash: txHash || `demo:${randomUUID()}`,
  });
  saveLedger(ledger);
  const b = balanceOf(u);
  res.json({
    credits_granted: grant,
    credits_remaining: b.remaining,
    purchased_credits: b.purchased,
    treasury: TREASURY,
    chainId: RH_CHAIN_ID,
    note: demo ? "Demo grant — wire RPC receipt verify before mainnet money" : "Recorded",
  });
});

app.get("/api/shop", (_req, res) => {
  res.json({
    chainId: RH_CHAIN_ID,
    chainName: "Robinhood Chain",
    treasury: TREASURY,
    creditsPerEth: CREDITS_PER_ETH,
    minEth: MIN_TOPUP_ETH,
    token: { symbol: "OAGT", name: "OpenAgent" },
    packs: [
      { eth: 0.005, label: "Starter" },
      { eth: 0.01, label: "Builder" },
      { eth: 0.05, label: "Pro desk" },
    ].map((p) => ({ ...p, credits: Math.floor(p.eth * CREDITS_PER_ETH) })),
  });
});

/** Helpful message if someone GETs /api/chat in browser */
app.get("/api/chat", (_req, res) => {
  res.status(405).json({
    error: {
      code: "method_not_allowed",
      message: "Use POST /api/chat with JSON body { messages, agentId } and header X-Wallet-Address",
    },
  });
});

app.post("/api/chat", async (req, res) => {
  const addr = walletFrom(req);
  if (!addr) {
    return res.status(401).json({
      error: { code: "unauthorized", message: "Connect wallet to chat." },
    });
  }
  if (!LLM_KEY) {
    return res.status(503).json({
      error: {
        code: "misconfigured",
        message: "LLM_API_KEY missing on server. Copy .env.example → .env and set key, then restart API.",
      },
    });
  }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const agentId = String(req.body?.agentId || "general");
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];
  const cost = COST[agent.mode] || 1;

  const ledger = loadLedger();
  const u = ensureUser(ledger, addr);
  const before = balanceOf(u);
  if (before.remaining < cost) {
    saveLedger(ledger);
    return res.status(402).json({
      error: {
        code: "credits_exhausted",
        message: `Need ${cost} credit(s), you have ${before.remaining}. Buy credits to continue.`,
        cost,
        remaining: before.remaining,
      },
    });
  }

  const userMsgs = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (!userMsgs.some((m) => m.role === "user")) {
    return res.status(400).json({
      error: { code: "validation_error", message: "Send at least one user message." },
    });
  }

  const payload = {
    model: LLM_MODEL,
    messages: [{ role: "system", content: agent.system }, ...userMsgs],
    temperature: 0.7,
    max_tokens: 2048,
  };

  let upstream;
  try {
    upstream = await fetch(`${LLM_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return res.status(502).json({
      error: { code: "upstream", message: e.message || "LLM network error" },
    });
  }

  const raw = await upstream.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  if (!upstream.ok) {
    return res.status(502).json({
      error: {
        code: "upstream",
        message: data?.error?.message || raw.slice(0, 300) || `LLM HTTP ${upstream.status}`,
      },
    });
  }

  const content =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "(empty model response)";

  if (!spend(u, cost)) {
    saveLedger(ledger);
    return res.status(402).json({
      error: { code: "credits_exhausted", message: "Out of credits." },
    });
  }
  saveLedger(ledger);
  const after = balanceOf(u);

  res.setHeader("X-Credits-Remaining", String(after.remaining));
  res.setHeader("X-Daily-Limit", String(DAILY));
  res.setHeader("X-Purchased-Credits", String(after.purchased));
  res.setHeader("X-Credit-Cost", String(cost));

  res.json({
    id: data?.id || randomUUID(),
    agentId: agent.id,
    model: LLM_MODEL,
    message: { role: "assistant", content },
    usage: data?.usage || null,
    credits: after,
    cost,
  });
});

// JSON 404 for unknown API routes (prevents HTML 404 / SPA fallback confusion)
app.use("/api", (req, res) => {
  res.status(404).json({
    error: {
      code: "not_found",
      message: `No API route ${req.method} ${req.originalUrl}. Is the OpenAgent API running on :${PORT}? Try: npm run dev`,
      hint: "Dev needs both Vite (:5173) and API (:8787). Or: npm run build && npm start",
    },
  });
});

// Static UI (production or SERVE_STATIC=1)
const dist = path.join(ROOT, "dist");
if (SERVE_STATIC && fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[openagent] api :${PORT} model=${LLM_MODEL} daily=${DAILY} key=${LLM_KEY ? "yes" : "NO"} static=${SERVE_STATIC && fs.existsSync(dist) ? "on" : "off"} root=${ROOT}`
  );
});
