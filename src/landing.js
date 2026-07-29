/**
 * OpenAgent marketing landing — Opentroy / OpenAgents inspired
 * Routes: /  → landing · /app → product (chat)
 * Domains: openagent.xyz (marketing) · app.openagent.xyz (app)
 */
import "./landing.css";

const APP_HREF = (() => {
  const env = String(import.meta.env.VITE_APP_URL || "").trim().replace(/\/$/, "");
  if (env) return env.endsWith("/app") ? env : `${env}/app`;
  // subdomain app.* → stay on app root
  if (typeof location !== "undefined" && /^app\./i.test(location.hostname)) return "/";
  return "/app";
})();

const FEATURES = [
  {
    k: "01",
    t: "Wallet-gated access",
    d: "Connect any EVM wallet. Your address is the account — no email, no password dump.",
  },
  {
    k: "02",
    t: "Daily free credits",
    d: "Start free every day. Spend credits on agent turns; top up when you need more firepower.",
  },
  {
    k: "03",
    t: "Specialist agents",
    d: "General, research, code review, crypto tracker, DeFi analyzer — pick the desk, not a blank model.",
  },
  {
    k: "04",
    t: "On-chain top-up rail",
    d: "Buy credits with native ETH on Robinhood Chain. Transparent packs. $OAGT product branding.",
  },
];

const STEPS = [
  { n: "1", t: "Connect", d: "Link your wallet or paste an address to unlock the desk." },
  { n: "2", t: "Choose an agent", d: "Pick a specialist. Each turn costs clear credits." },
  { n: "3", t: "Execute", d: "Chat, research, review — agents work in your credit budget." },
];

const AGENTS = [
  { icon: "✦", name: "General", cost: "1 cr" },
  { icon: "🔎", name: "Web Research", cost: "3 cr" },
  { icon: "🧪", name: "Code Review", cost: "2 cr" },
  { icon: "📈", name: "Crypto Tracker", cost: "3 cr" },
  { icon: "🏦", name: "DeFi Analyzer", cost: "3 cr" },
  { icon: "🎨", name: "Image Prompt", cost: "6 cr" },
];

const FAQS = [
  {
    q: "What is OpenAgent?",
    a: "A wallet-gated AI chat desk: connect a wallet, spend credits on specialist agents, top up on-chain when free daily credits run out.",
  },
  {
    q: "Do I need a credit card?",
    a: "No. Free daily credits cover light use. Extra capacity is purchased with ETH on Robinhood Chain — not a SaaS subscription.",
  },
  {
    q: "Where does the app live?",
    a: "Marketing site on openagent.xyz (coming). Product desk at app.openagent.xyz /app. API stays on our VPS — keys never ship to the browser.",
  },
  {
    q: "What is $OAGT?",
    a: "Product credit branding for OpenAgent. Credits meter usage inside the app; treat $OAGT as the desk’s unit of work, not financial advice.",
  },
  {
    q: "Is this production-ready?",
    a: "Early preview. Expect rapid iteration. Core loop works: wallet → credits → agents → chat.",
  },
  {
    q: "How is this different from a normal chatbot?",
    a: "Identity is the wallet, metering is credits, and agents are mode-priced. Built for crypto-native operators who already live in wallets.",
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isAppHost() {
  if (typeof location === "undefined") return false;
  const h = location.hostname;
  if (/^app\./i.test(h)) return true;
  // vercel preview of product-only deploys can force app via env
  if (import.meta.env.VITE_FORCE_APP === "1") return true;
  return false;
}

export function isAppPath() {
  const p = (location.pathname || "/").replace(/\/+$/, "") || "/";
  return p === "/app" || p.startsWith("/app/");
}

export function shouldShowApp() {
  return isAppHost() || isAppPath();
}

export function renderLanding(root) {
  document.documentElement.classList.add("landing-mode");
  document.body.classList.add("landing-mode");

  root.innerHTML = `
  <div class="lp">
    <div class="lp-bg" aria-hidden="true">
      <div class="lp-grid"></div>
      <div class="lp-orb o1"></div>
      <div class="lp-orb o2"></div>
      <div class="lp-orb o3"></div>
    </div>

    <header class="lp-nav">
      <a class="lp-brand" href="/">
        <img src="/token-oagt.svg" width="32" height="32" alt="" />
        <span>OpenAgent</span>
        <em>$OAGT</em>
      </a>
      <nav class="lp-links">
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <a href="#agents">Agents</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div class="lp-nav-cta">
        <a class="lp-btn ghost" href="${esc(APP_HREF)}">Log in</a>
        <a class="lp-btn primary" href="${esc(APP_HREF)}">Launch app →</a>
      </div>
      <button type="button" class="lp-burger" id="lp-burger" aria-label="Menu">☰</button>
    </header>

    <div class="lp-drawer" id="lp-drawer" hidden>
      <a href="#features">Features</a>
      <a href="#how">How it works</a>
      <a href="#agents">Agents</a>
      <a href="#faq">FAQ</a>
      <a class="lp-btn primary" href="${esc(APP_HREF)}">Launch app</a>
    </div>

    <section class="lp-hero">
      <div class="lp-pill"><span class="dot"></span> Early preview · wallet-first</div>
      <h1>Where AI agents<br/><span class="grad">get real work done.</span></h1>
      <p class="lp-lead">
        Build agents. Meter usage with credits. Execute from one desk —
        gated by your wallet, powered by <strong>$OAGT</strong> credits.
      </p>
      <div class="lp-hero-cta">
        <a class="lp-btn primary xl" href="${esc(APP_HREF)}">Run in Web</a>
        <a class="lp-btn ghost xl" href="#how">See how it works</a>
      </div>
      <p class="lp-micro">10 free credits / day · Robinhood Chain top-up · No email required</p>
    </section>

    <section class="lp-preview" aria-label="Product preview">
      <div class="lp-window">
        <div class="lp-win-bar">
          <span class="t red"></span><span class="t yel"></span><span class="t grn"></span>
          <strong>OpenAgent desk</strong>
          <em>10 credits</em>
        </div>
        <div class="lp-win-body">
          <aside>
            <div class="mini-brand">✦ Agents</div>
            <button type="button" class="on">General</button>
            <button type="button">Crypto Tracker</button>
            <button type="button">Code Review</button>
            <button type="button">DeFi Analyzer</button>
          </aside>
          <div class="mini-chat">
            <h3>How can I help you today?</h3>
            <div class="chips">
              <span>Live market brief</span>
              <span>Review this contract risk</span>
              <span>Draft a product one-pager</span>
            </div>
            <div class="fake-input">Ask anything… <b>↵</b></div>
          </div>
        </div>
      </div>
    </section>

    <section class="lp-section" id="features">
      <p class="lp-kicker">Infrastructure</p>
      <h2>Deploy agents with budgets, not blank chat boxes.</h2>
      <p class="lp-sub">Inspired by desks like Opentroy — wallet identity, credit metering, specialist modes.</p>
      <div class="lp-grid-4">
        ${FEATURES.map(
          (f) => `
          <article class="lp-card">
            <span class="lp-num">${f.k}</span>
            <h3>${esc(f.t)}</h3>
            <p>${esc(f.d)}</p>
          </article>`
        ).join("")}
      </div>
    </section>

    <section class="lp-section" id="how">
      <p class="lp-kicker">How it works</p>
      <h2>One wallet to begin. Three steps to clarity.</h2>
      <div class="lp-steps">
        ${STEPS.map(
          (s) => `
          <article class="lp-step">
            <div class="n">${s.n}</div>
            <h3>${esc(s.t)}</h3>
            <p>${esc(s.d)}</p>
          </article>`
        ).join("")}
      </div>
    </section>

    <section class="lp-section" id="agents">
      <p class="lp-kicker">Agent catalog</p>
      <h2>Specialists with clear credit costs.</h2>
      <div class="lp-agents">
        ${AGENTS.map(
          (a) => `
          <article class="lp-agent">
            <span class="ic">${a.icon}</span>
            <div>
              <strong>${esc(a.name)}</strong>
              <small>${esc(a.cost)} / turn</small>
            </div>
          </article>`
        ).join("")}
      </div>
      <div class="lp-center">
        <a class="lp-btn primary" href="${esc(APP_HREF)}">Open agent desk →</a>
      </div>
    </section>

    <section class="lp-section" id="faq">
      <p class="lp-kicker">FAQ</p>
      <h2>Your questions, answered with clarity.</h2>
      <div class="lp-faq" id="lp-faq">
        ${FAQS.map(
          (f, i) => `
          <details class="lp-faq-item" ${i === 0 ? "open" : ""}>
            <summary>${esc(f.q)}</summary>
            <p>${esc(f.a)}</p>
          </details>`
        ).join("")}
      </div>
    </section>

    <section class="lp-cta-band">
      <div>
        <h2>Step into the agent desk.</h2>
        <p>Connect a wallet. Spend free credits. Scale with on-chain top-ups.</p>
      </div>
      <a class="lp-btn primary xl" href="${esc(APP_HREF)}">Run in Web</a>
    </section>

    <footer class="lp-foot">
      <div class="lp-foot-brand">
        <img src="/token-oagt.svg" width="28" height="28" alt="" />
        <div>
          <strong>OpenAgent</strong>
          <span>Wallet · credits · agents · $OAGT</span>
        </div>
      </div>
      <div class="lp-foot-cols">
        <div>
          <b>Product</b>
          <a href="${esc(APP_HREF)}">App</a>
          <a href="#features">Features</a>
          <a href="#agents">Agents</a>
        </div>
        <div>
          <b>Domains</b>
          <span>openagent.xyz</span>
          <span>app.openagent.xyz</span>
          <span>API on VPS</span>
        </div>
        <div>
          <b>Token</b>
          <span>$OAGT credits</span>
          <span>Not financial advice</span>
        </div>
      </div>
      <p class="lp-copy">© ${new Date().getFullYear()} OpenAgent · Early preview</p>
    </footer>
  </div>`;

  const burger = root.querySelector("#lp-burger");
  const drawer = root.querySelector("#lp-drawer");
  burger?.addEventListener("click", () => {
    const open = drawer.hasAttribute("hidden");
    if (open) drawer.removeAttribute("hidden");
    else drawer.setAttribute("hidden", "");
  });
  drawer?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => drawer.setAttribute("hidden", ""))
  );
}
