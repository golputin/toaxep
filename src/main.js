import "./style.css";
import { AGENTS_FALLBACK } from "./agents.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/**
 * API base:
 * - Production on Vercel: leave empty → same-origin `/api/*` rewritten to VPS (see vercel.json)
 * - Override: VITE_API_BASE=https://api.example.com
 * - Local vite: empty → vite.config.js proxies to :8787
 */
const API_BASE = String(import.meta.env.VITE_API_BASE || "")
  .trim()
  .replace(/\/$/, "");

function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

const state = {
  wallet: localStorage.getItem("oa_wallet") || null,
  sidebarOpen: true,
  view: "chat", // chat | agents | shop
  agentId: localStorage.getItem("oa_agent") || "general",
  agents: AGENTS_FALLBACK,
  threads: loadThreads(),
  activeThread: null,
  credits: null,
  shop: null,
  busy: false,
  previewDismissed: localStorage.getItem("oa_preview_dismissed") === "1",
  apiBase: API_BASE || "(same-origin / vite proxy)",
};

function loadThreads() {
  try {
    return JSON.parse(localStorage.getItem("oa_threads") || "[]");
  } catch {
    return [];
  }
}
function saveThreads() {
  localStorage.setItem("oa_threads", JSON.stringify(state.threads.slice(0, 40)));
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (state.wallet) h["X-Wallet-Address"] = state.wallet;
  return h;
}

async function api(path, opts = {}) {
  const url = apiUrl(path);
  let res;
  try {
    res = await fetch(url, {
      ...opts,
      headers: { ...headers(), ...(opts.headers || {}) },
    });
  } catch (e) {
    const err = new Error(
      `Network error → ${url}. Check VITE_API_BASE on Vercel and that VPS API is up (CORS / firewall port).`
    );
    err.status = 0;
    err.data = { error: { code: "network", message: e.message } };
    throw err;
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const looksHtml = typeof text === "string" && text.trimStart().startsWith("<!DOCTYPE");
    const msg =
      data?.error?.message ||
      data?.message ||
      (res.status === 404 || looksHtml
        ? `API 404 at ${url} — Vercel is static only. Point VITE_API_BASE to your VPS API (e.g. http://IP:8787), redeploy frontend.`
        : `HTTP ${res.status}`);
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function shortAddr(a) {
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function newThread() {
  const t = {
    id: crypto.randomUUID(),
    title: "New chat",
    agentId: state.agentId,
    messages: [],
    updatedAt: Date.now(),
  };
  state.threads.unshift(t);
  state.activeThread = t.id;
  saveThreads();
  render();
  return t;
}

function active() {
  return state.threads.find((t) => t.id === state.activeThread) || null;
}

function ensureActive() {
  let t = active();
  if (!t) t = newThread();
  return t;
}

// ——— wallet ———
async function connectWallet() {
  const eth = window.ethereum;
  if (eth) {
    try {
      const accs = await eth.request({ method: "eth_requestAccounts" });
      if (accs?.[0]) {
        setWallet(accs[0]);
        return;
      }
    } catch (e) {
      toast(e.message || "Wallet rejected");
    }
  }
  // manual fallback
  const raw = prompt("Paste wallet address (0x…)\nNo extension detected — manual connect:");
  if (raw && /^0x[a-fA-F0-9]{40}$/.test(raw.trim())) setWallet(raw.trim());
  else if (raw) toast("Invalid address");
}

function setWallet(addr) {
  state.wallet = addr.toLowerCase();
  localStorage.setItem("oa_wallet", state.wallet);
  refreshCredits();
  render();
  toast("Wallet connected " + shortAddr(state.wallet));
}

function disconnectWallet() {
  state.wallet = null;
  localStorage.removeItem("oa_wallet");
  state.credits = null;
  render();
}

async function refreshCredits() {
  if (!state.wallet) return;
  try {
    state.credits = await api("/api/v1/credits");
    renderCredits();
  } catch (e) {
    console.warn(e);
  }
}

async function loadAgents() {
  try {
    const d = await api("/api/agents");
    if (d.agents?.length) state.agents = d.agents;
  } catch {
    /* fallback local */
  }
}

async function loadShop() {
  try {
    state.shop = await api("/api/shop");
  } catch {
    state.shop = null;
  }
}

// ——— chat ———
async function sendMessage(text) {
  if (!state.wallet) {
    toast("Connect wallet to chat");
    return;
  }
  if (state.busy) return;
  const content = text.trim();
  if (!content) return;

  const t = ensureActive();
  t.messages.push({ role: "user", content });
  if (t.title === "New chat") t.title = content.slice(0, 42) + (content.length > 42 ? "…" : "");
  t.updatedAt = Date.now();
  saveThreads();
  render();
  scrollChat();

  state.busy = true;
  renderComposer();
  const thinkingId = "thinking-" + Date.now();
  t.messages.push({ role: "assistant", content: "…", pending: true, id: thinkingId });
  renderMessages();
  scrollChat();

  try {
    const data = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        agentId: t.agentId || state.agentId,
        // only send clean turns — never re-send error bubbles to the model
        messages: t.messages
          .filter((m) => !m.pending && !m.error)
          .filter((m) => m.role === "user" || (m.role === "assistant" && !String(m.content).startsWith("⚠️")))
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    t.messages = t.messages.filter((m) => !m.pending);
    const text = data.text || data.message?.content || "(empty)";
    t.messages.push({ role: "assistant", content: text });
    if (typeof data.credits === "number") {
      state.credits = {
        ...(state.credits || {}),
        credits_remaining: data.credits,
        remaining: data.credits,
      };
    } else if (data.credits && typeof data.credits === "object") {
      state.credits = {
        credits_remaining: data.credits.remaining ?? data.credits.credits_remaining,
        purchased_credits: data.credits.purchased ?? data.credits.purchased_credits,
        daily_limit: data.credits.dailyLimit ?? data.credits.daily_limit,
        credits_used: data.credits.dailyUsed ?? data.credits.credits_used,
        free_left: data.credits.freeLeft ?? data.credits.free_left,
      };
    }
    t.updatedAt = Date.now();
    saveThreads();
  } catch (e) {
    t.messages = t.messages.filter((m) => !m.pending);
    const msg =
      e.status === 402
        ? e.message + " — open Buy Credits."
        : e.status === 401
          ? "Connect wallet to chat."
          : "Something went wrong. Try again in a moment.";
    t.messages.push({ role: "assistant", content: `⚠️ ${msg}`, error: true });
    saveThreads();
    if (e.status === 402) state.view = "shop";
  } finally {
    state.busy = false;
    render();
    scrollChat();
    refreshCredits();
  }
}

async function demoTopup(eth) {
  if (!state.wallet) return toast("Connect wallet first");
  try {
    const d = await api("/api/credits/verify", {
      method: "POST",
      body: JSON.stringify({
        ethAmount: eth,
        txHash: `demo:${Date.now()}`,
        walletAddress: state.wallet,
      }),
    });
    toast(`+${d.credits_granted} credits added (demo)`);
    await refreshCredits();
    render();
  } catch (e) {
    toast(e.message);
  }
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function scrollChat() {
  const box = $("#messages");
  if (box) box.scrollTop = box.scrollHeight;
}

// ——— render ———
function render() {
  const app = $("#app");
  app.innerHTML = `
    <div class="bg-root" aria-hidden="true">
      <div class="bg-orb a"></div>
      <div class="bg-orb b"></div>
      <div class="bg-orb c"></div>
    </div>
    <div class="bg-noise" aria-hidden="true"></div>
    <div class="shell ${state.sidebarOpen ? "" : "collapsed"}">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark"><img src="/token-oagt.svg" alt="$OAGT" width="36" height="36" /></div>
          <div>
            <strong>OpenAgent</strong>
            <small>wallet · credits · agents</small>
            <span class="token-chip">$OAGT</span>
          </div>
          <button type="button" class="icon-btn" id="btn-collapse" title="Collapse">‹</button>
        </div>
        <button type="button" class="btn primary block" id="btn-new">+ New Chat</button>
        <nav class="nav">
          <button type="button" data-view="chat" class="${state.view === "chat" ? "on" : ""}">Chat</button>
          <button type="button" data-view="agents" class="${state.view === "agents" ? "on" : ""}">Explore Agents</button>
          <button type="button" data-view="shop" class="${state.view === "shop" ? "on" : ""}">Buy Credits</button>
        </nav>
        <div class="hist-label">History</div>
        <div class="hist" id="hist"></div>
        <div class="side-foot">
          ${
            state.wallet
              ? `<button type="button" class="btn ghost block" id="btn-addr" title="Disconnect">${shortAddr(state.wallet)}</button>`
              : `<button type="button" class="btn block" id="btn-connect-side">Connect Wallet</button>`
          }
        </div>
      </aside>
      <main class="main">
        <header class="top">
          <button type="button" class="icon-btn mobile-only" id="btn-menu">☰</button>
          <div class="grow"></div>
          <div class="credits-pill" id="credits-pill">—</div>
          ${
            state.wallet
              ? `<button type="button" class="btn" id="btn-top-disc">${shortAddr(state.wallet)}</button>`
              : `<button type="button" class="btn primary" id="btn-connect">Connect Wallet</button>`
          }
        </header>
        <div class="stage" id="stage"></div>
      </main>
    </div>
    <div id="toasts"></div>
  `;

  $("#btn-collapse")?.addEventListener("click", () => {
    state.sidebarOpen = !state.sidebarOpen;
    render();
  });
  $("#btn-menu")?.addEventListener("click", () => {
    state.sidebarOpen = !state.sidebarOpen;
    render();
  });
  $("#btn-new")?.addEventListener("click", () => {
    state.view = "chat";
    newThread();
  });
  $$("[data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      state.view = b.getAttribute("data-view");
      render();
    })
  );
  $("#btn-connect")?.addEventListener("click", connectWallet);
  $("#btn-connect-side")?.addEventListener("click", connectWallet);
  $("#btn-top-disc")?.addEventListener("click", disconnectWallet);
  $("#btn-addr")?.addEventListener("click", disconnectWallet);

  renderHist();
  renderCredits();
  renderStage();
}

function renderHist() {
  const hist = $("#hist");
  if (!hist) return;
  if (!state.wallet) {
    hist.innerHTML = `<p class="muted tiny">No chats yet. Connect wallet to keep history here.</p>`;
    return;
  }
  if (!state.threads.length) {
    hist.innerHTML = `<p class="muted tiny">No chats yet.</p>`;
    return;
  }
  hist.innerHTML = state.threads
    .map(
      (t) => `
    <button type="button" class="hist-item ${t.id === state.activeThread ? "on" : ""}" data-tid="${t.id}">
      <span>${escapeHtml(t.title)}</span>
    </button>`
    )
    .join("");
  $$(".hist-item", hist).forEach((b) =>
    b.addEventListener("click", () => {
      state.activeThread = b.getAttribute("data-tid");
      state.view = "chat";
      render();
    })
  );
}

function renderCredits() {
  const pill = $("#credits-pill");
  if (!pill) return;
  if (!state.wallet) {
    pill.textContent = "Connect for credits";
    return;
  }
  const c = state.credits;
  if (!c) {
    pill.textContent = "Credits …";
    return;
  }
  pill.innerHTML = `<b>${c.credits_remaining ?? "—"}</b> credits · free ${c.free_left ?? "?"}/${c.daily_limit ?? 10}`;
}

function renderStage() {
  const stage = $("#stage");
  if (!stage) return;
  if (state.view === "agents") return renderAgents(stage);
  if (state.view === "shop") return renderShop(stage);
  renderChat(stage);
}

function renderAgents(stage) {
  stage.innerHTML = `
    <div class="panel">
      <h1>Explore Agents</h1>
      <p class="muted">Pick a specialist. Credit cost varies by tool weight.</p>
      <div class="agent-grid">
        ${state.agents
          .map(
            (a) => `
          <button type="button" class="agent-card ${state.agentId === a.id ? "on" : ""}" data-aid="${a.id}">
            <div class="ico">${a.icon || "◆"}</div>
            <div>
              <strong>${escapeHtml(a.name)}</strong>
              <small>${escapeHtml(a.blurb || "")}</small>
              <em>${a.creditCost ?? 1} cr / msg</em>
            </div>
          </button>`
          )
          .join("")}
      </div>
    </div>`;
  $$(".agent-card", stage).forEach((b) =>
    b.addEventListener("click", () => {
      state.agentId = b.getAttribute("data-aid");
      localStorage.setItem("oa_agent", state.agentId);
      const t = ensureActive();
      t.agentId = state.agentId;
      saveThreads();
      state.view = "chat";
      toast("Agent: " + state.agentId);
      render();
    })
  );
}

function renderShop(stage) {
  const shop = state.shop;
  stage.innerHTML = `
    <div class="panel narrow">
      <h1>Buy Credits</h1>
      <p class="muted">Top up with native ETH on <b>Robinhood Chain</b> (${shop?.chainId || 4663}). Demo grant enabled for local dev.</p>
      <div class="shop-hero">
        <img src="/token-oagt.svg" alt="$OAGT" width="72" height="72" />
        <div>
          <strong>$OAGT · OpenAgent</strong>
          <p class="muted tiny" style="margin:6px 0 0">Credits power agent messages. Token mark is product branding (not a live claim of on-chain listing).</p>
        </div>
      </div>
      <div class="shop-meta">
        <div><span>Rate</span><b>${(shop?.creditsPerEth || 100000).toLocaleString()} cr / ETH</b></div>
        <div><span>Treasury</span><b class="mono">${shortAddr(shop?.treasury || "0x0")}</b></div>
      </div>
      <div class="packs">
        ${(shop?.packs || [{ eth: 0.005, credits: 500, label: "Starter" }, { eth: 0.01, credits: 1000, label: "Builder" }])
          .map(
            (p) => `
          <button type="button" class="pack" data-eth="${p.eth}">
            <strong>${escapeHtml(p.label || "Pack")}</strong>
            <span>${p.eth} ETH</span>
            <b>+${p.credits} credits</b>
          </button>`
          )
          .join("")}
      </div>
      <p class="tiny muted">Production: verify tx receipt to treasury via RPC. This build uses <code>demo:</code> top-up for testing.</p>
    </div>`;
  $$(".pack", stage).forEach((b) =>
    b.addEventListener("click", () => demoTopup(Number(b.getAttribute("data-eth"))))
  );
}

function renderChat(stage) {
  const t = active();
  const agent = state.agents.find((a) => a.id === (t?.agentId || state.agentId));
  const empty = !t || t.messages.length === 0;

  stage.innerHTML = `
    <div class="chat">
      ${
        !state.previewDismissed
          ? `<div class="banner">
              <span>Preview build — OpenAgent (Opentroy-inspired). Not affiliated with Opentroy.</span>
              <button type="button" id="dismiss-preview">Dismiss</button>
            </div>`
          : ""
      }
      <div class="messages" id="messages"></div>
      ${
        empty
          ? `<div class="hero" id="hero">
              <img class="hero-token" src="/token-oagt.svg" width="88" height="88" alt="$OAGT" />
              <h1>How can I help you today?</h1>
              <p class="muted">Agent: <b>${escapeHtml(agent?.name || "General")}</b> · ${agent?.creditCost ?? 1} credit / message · <b>$OAGT</b> credits</p>
              <div class="suggestions">
                <button type="button" data-sug="Summarize the risks of wallet-gated AI credit systems.">Credit system risks</button>
                <button type="button" data-sug="Write a sharp product brief for an on-chain agent marketplace.">Agent marketplace brief</button>
                <button type="button" data-sug="Review this idea: free daily credits + ETH top-up on Robinhood Chain.">Review freemium idea</button>
              </div>
            </div>`
          : ""
      }
      <form class="composer" id="composer">
        <textarea id="input" rows="1" placeholder="${
          state.wallet ? "Ask anything…" : "Connect wallet to chat…"
        }" ${state.wallet ? "" : "disabled"}></textarea>
        <div class="composer-bar">
          <button type="button" class="chip" id="chip-agent">${escapeHtml(agent?.name || "Agent")}</button>
          <div class="grow"></div>
          <button type="submit" class="btn primary" id="btn-send" ${
            !state.wallet || state.busy ? "disabled" : ""
          }>Send</button>
        </div>
      </form>
    </div>`;

  $("#dismiss-preview")?.addEventListener("click", () => {
    state.previewDismissed = true;
    localStorage.setItem("oa_preview_dismissed", "1");
    render();
  });
  $("#chip-agent")?.addEventListener("click", () => {
    state.view = "agents";
    render();
  });
  $$("[data-sug]").forEach((b) =>
    b.addEventListener("click", () => sendMessage(b.getAttribute("data-sug")))
  );

  const ta = $("#input");
  ta?.addEventListener("input", () => {
    ta.style.height = "auto";
    ta.style.height = Math.min(160, ta.scrollHeight) + "px";
  });
  ta?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#composer")?.requestSubmit();
    }
  });
  $("#composer")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = ta?.value || "";
    if (ta) ta.value = "";
    sendMessage(v);
  });

  renderMessages();
}

function renderMessages() {
  const box = $("#messages");
  const t = active();
  if (!box || !t) return;
  box.innerHTML = t.messages
    .map(
      (m) => `
    <div class="msg ${m.role} ${m.error ? "err" : ""} ${m.pending ? "pending" : ""}">
      <div class="role">${m.role === "user" ? "You" : "OpenAgent"}</div>
      <div class="body">${formatMsg(m.content)}</div>
    </div>`
    )
    .join("");
}

function renderComposer() {
  const btn = $("#btn-send");
  if (btn) btn.disabled = !state.wallet || state.busy;
}

function formatMsg(text) {
  const esc = escapeHtml(text || "");
  // very light markdown: code fences + bold + newlines
  return esc
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// boot
(async function boot() {
  await Promise.all([loadAgents(), loadShop()]);
  if (state.wallet) await refreshCredits();
  if (!state.activeThread && state.threads[0]) state.activeThread = state.threads[0].id;
  render();
  // health
  api("/api/health")
    .then((h) => {
      if (!h.llmConfigured) toast("Server: LLM key missing — chat will fail");
    })
    .catch(() => toast("API offline — run npm run dev"));
})();
