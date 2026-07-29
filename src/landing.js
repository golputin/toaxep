/**
 * HoodAgent marketing — paybox-inspired premium dark landing
 * / → landing · /app → product
 */
import "./landing.css";

const APP_HREF = (() => {
  const env = String(import.meta.env.VITE_APP_URL || "").trim().replace(/\/$/, "");
  if (env) return env.endsWith("/app") ? env : `${env}/app`;
  if (typeof location !== "undefined" && /^app\./i.test(location.hostname)) return "/";
  return "/app";
})();

const HERO_MODES = [
  { id: "general", label: "General", line: "can ship product briefs." },
  { id: "crypto", label: "Crypto", line: "can track markets." },
  { id: "code", label: "Code Review", line: "can review your contracts." },
  { id: "defi", label: "DeFi", line: "can map protocol risk." },
  { id: "research", label: "Research", line: "can dig the web." },
];

const USE_CASES = [
  { tag: "Markets", title: "Morning brief", body: "What’s moving on RH + majors. Blunt risk, no fluff." },
  { tag: "Code", title: "Contract review", body: "Flag bugs, reentrancy, and missing checks before you ship." },
  { tag: "DeFi", title: "Pool forensics", body: "Liquidity, fees, and weird tokenomics — structured." },
  { tag: "Product", title: "One-pager", body: "Turn a messy idea into a sharp agent-desk brief." },
  { tag: "Research", title: "Competitor scan", body: "Pull signals, compare, and cut to the go / no-go." },
  { tag: "Credits", title: "Wallet top-up", body: "Buy $HOOD with native ETH. Verified on-chain." },
  { tag: "Agents", title: "Specialist desk", body: "Pick the mode, not a blank chat box." },
  { tag: "Ops", title: "Daily free run", body: "10 free credits every day. No email signup." },
];

const PILLARS = [
  {
    k: "01",
    t: "Your wallet is the account",
    d: "Connect once. Address = identity. No password dump, no SaaS email gate.",
  },
  {
    k: "02",
    t: "Credits, not subscriptions",
    d: "Free daily allotment. Extra capacity is on-chain ETH → $HOOD credits.",
  },
  {
    k: "03",
    t: "Specialists with clear cost",
    d: "General, research, code, crypto, DeFi — each turn priced up front.",
  },
  {
    k: "04",
    t: "Keys stay off the browser",
    d: "Model keys live on the API. The UI never ships provider secrets.",
  },
];

const AGENTS = [
  { icon: "✦", name: "General", cost: "1", blurb: "Sharp default desk" },
  { icon: "◈", name: "Web Research", cost: "3", blurb: "Structured findings" },
  { icon: "⬡", name: "Code Review", cost: "2", blurb: "Bugs & security" },
  { icon: "◎", name: "Crypto Tracker", cost: "3", blurb: "Blunt market takes" },
  { icon: "▣", name: "DeFi Analyzer", cost: "3", blurb: "Protocol risk" },
  { icon: "◇", name: "Image Prompt", cost: "6", blurb: "Ready-to-paste prompts" },
];

const FAQS = [
  {
    q: "What is HoodAgent?",
    a: "A wallet-gated AI desk: connect a wallet, spend free daily credits on specialist agents, top up with ETH on Robinhood Chain when you need more.",
  },
  {
    q: "Do I need a credit card?",
    a: "No. Free daily credits cover light use. Extra capacity is purchased with native ETH — not a SaaS subscription.",
  },
  {
    q: "How does top-up work?",
    a: "Pick a pack, confirm the ETH transfer to the treasury from your wallet, and credits grant after on-chain verification.",
  },
  {
    q: "What is $HOOD?",
    a: "In-app credit branding. Credits meter usage inside the product — not financial advice.",
  },
  {
    q: "Which chain?",
    a: "Robinhood Chain (4663) for credit top-ups. Connect any EVM wallet that can switch networks.",
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
  document.title = "HoodAgent — Wallet-gated AI desk";

  const cases = [...USE_CASES, ...USE_CASES]
    .map(
      (c) => `
      <article class="lp-case">
        <span class="lp-case-tag">${esc(c.tag)}</span>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.body)}</p>
      </article>`
    )
    .join("");

  root.innerHTML = `
  <div class="lp">
    <div class="lp-noise" aria-hidden="true"></div>
    <div class="lp-glow" aria-hidden="true"></div>

    <header class="lp-nav">
      <a class="lp-brand" href="/">
        <img src="/logo-hood-512.png" width="32" height="32" alt="" />
        <span>HoodAgent</span>
      </a>
      <nav class="lp-links">
        <a href="#product">Product</a>
        <a href="#agents">Agents</a>
        <a href="#how">How it works</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div class="lp-nav-cta">
        <a class="lp-btn ghost" href="${esc(APP_HREF)}">Log in</a>
        <a class="lp-btn primary" href="${esc(APP_HREF)}">Open desk →</a>
      </div>
      <button type="button" class="lp-burger" id="lp-burger" aria-label="Menu">
        <span></span><span></span>
      </button>
    </header>

    <div class="lp-drawer" id="lp-drawer" hidden>
      <a href="#product">Product</a>
      <a href="#agents">Agents</a>
      <a href="#how">How it works</a>
      <a href="#faq">FAQ</a>
      <a class="lp-btn primary" href="${esc(APP_HREF)}">Open desk</a>
    </div>

    <!-- HERO -->
    <section class="lp-hero">
      <div class="lp-hero-copy">
        <div class="lp-eyebrow">
          <span class="lp-dot"></span>
          Robinhood Chain · wallet-first
        </div>
        <h1 class="lp-h1">
          <span class="lp-h1-static">Now your</span>
          <span class="lp-h1-swap" id="hero-label">General</span>
          <span class="lp-h1-static" id="hero-line">can ship product briefs.</span>
        </h1>
        <p class="lp-lead">
          Wallet-gated agents. Metered <strong>$HOOD</strong> credits.
          Connect once — chat, research, review under a real budget.
        </p>
        <div class="lp-mode-row" id="hero-modes" role="tablist" aria-label="Agent modes">
          ${HERO_MODES.map(
            (m, i) => `
            <button type="button" class="lp-mode ${i === 0 ? "on" : ""}" data-mode="${m.id}" role="tab" aria-selected="${i === 0}">
              ${esc(m.label)}
            </button>`
          ).join("")}
        </div>
        <div class="lp-hero-cta">
          <a class="lp-btn primary xl" href="${esc(APP_HREF)}">Open HoodAgent</a>
          <a class="lp-btn ghost xl" href="#product">See the desk</a>
        </div>
        <p class="lp-micro">10 free credits / day · No email · ETH top-up on RH</p>
      </div>

      <div class="lp-hero-stage" aria-hidden="false">
        <div class="lp-device">
          <div class="lp-device-bar">
            <span class="t"></span><span class="t"></span><span class="t"></span>
            <strong>HoodAgent</strong>
            <em id="device-status">General Connected</em>
          </div>
          <div class="lp-device-body">
            <aside class="lp-device-side">
              <div class="mini-label">Agents</div>
              ${AGENTS.slice(0, 4)
                .map(
                  (a, i) =>
                    `<button type="button" class="mini-agent ${i === 0 ? "on" : ""}">${a.icon} ${esc(a.name)}</button>`
                )
                .join("")}
              <div class="mini-credits">
                <span>Credits</span>
                <b>10</b>
              </div>
            </aside>
            <div class="lp-device-chat">
              <div class="bubble user">Review freemium + ETH top-up for an agent desk.</div>
              <div class="bubble bot" id="demo-bot">
                <span class="bot-name">HoodAgent</span>
                Free daily credits cover light use. Paid capacity settles on-chain —
                wallet is the account, credits are the meter. Ship the desk, not another SaaS login.
              </div>
              <div class="bubble-meta">
                <span class="ok-pill">Approved — 1 credit</span>
                <span>General · RH 4663</span>
              </div>
              <div class="fake-composer">
                <span>Ask anything…</span>
                <b>Send</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- USE CASE MARQUEE -->
    <section class="lp-marquee-wrap" id="product" aria-label="Use cases">
      <div class="lp-section-head center tight">
        <p class="lp-kicker">What you can run</p>
        <h2>Trade ideas, reviews, & research — one desk.</h2>
      </div>
      <div class="lp-marquee" data-marquee>
        <div class="lp-marquee-track">${cases}</div>
      </div>
    </section>

    <!-- PILLARS -->
    <section class="lp-section" id="why">
      <div class="lp-section-head">
        <p class="lp-kicker">Why HoodAgent</p>
        <h2>The agent desk built for wallet natives.</h2>
        <p class="lp-sub">Identity, metering, and settlement that match how crypto operators already work.</p>
      </div>
      <div class="lp-bento">
        ${PILLARS.map(
          (p) => `
          <article class="lp-bento-card">
            <span class="lp-num">${p.k}</span>
            <h3>${esc(p.t)}</h3>
            <p>${esc(p.d)}</p>
          </article>`
        ).join("")}
      </div>
    </section>

    <!-- AGENTS -->
    <section class="lp-section" id="agents">
      <div class="lp-section-head">
        <p class="lp-kicker">Agent catalog</p>
        <h2>Specialists. Clear credit cost.</h2>
        <p class="lp-sub">Pick the mode before you spend a turn.</p>
      </div>
      <div class="lp-agent-grid">
        ${AGENTS.map(
          (a) => `
          <a class="lp-agent-card" href="${esc(APP_HREF)}">
            <div class="lp-agent-ico">${a.icon}</div>
            <div class="lp-agent-meta">
              <strong>${esc(a.name)}</strong>
              <span>${esc(a.blurb)}</span>
            </div>
            <em>${esc(a.cost)} cr</em>
          </a>`
        ).join("")}
      </div>
    </section>

    <!-- HOW -->
    <section class="lp-section" id="how">
      <div class="lp-section-head">
        <p class="lp-kicker">How it works</p>
        <h2>Three steps. No lock-in form.</h2>
      </div>
      <div class="lp-steps">
        <article class="lp-step">
          <div class="n">01</div>
          <h3>Connect wallet</h3>
          <p>Any EVM wallet. Your address unlocks the desk.</p>
        </article>
        <article class="lp-step">
          <div class="n">02</div>
          <h3>Choose an agent</h3>
          <p>Specialist modes with transparent credit costs.</p>
        </article>
        <article class="lp-step">
          <div class="n">03</div>
          <h3>Execute</h3>
          <p>Chat under budget. Top up with ETH when free credits run out.</p>
        </article>
      </div>
    </section>

    <!-- OPEN -->
    <section class="lp-section lp-open">
      <div class="lp-open-grid">
        <article>
          <h3>Any wallet.</h3>
          <p>MetaMask, Rabby, or paste an address to view credits.</p>
          <div class="lp-chips">
            <span>MetaMask</span><span>Rabby</span><span>WalletConnect-ready</span>
          </div>
        </article>
        <article>
          <h3>Any agent mode.</h3>
          <p>Swap specialists mid-session without losing the thread.</p>
          <div class="lp-chips">
            <span>General</span><span>Research</span><span>Code</span><span>Crypto</span>
          </div>
        </article>
        <article>
          <h3>On-chain credits.</h3>
          <p>Native ETH on Robinhood Chain. Verified receipts only.</p>
          <div class="lp-chips">
            <span>RH 4663</span><span>$HOOD</span><span>Treasury verify</span>
          </div>
        </article>
      </div>
    </section>

    <!-- FAQ -->
    <section class="lp-section" id="faq">
      <div class="lp-section-head">
        <p class="lp-kicker">FAQ</p>
        <h2>Straight answers.</h2>
      </div>
      <div class="lp-faq">
        ${FAQS.map(
          (f, i) => `
          <details class="lp-faq-item" ${i === 0 ? "open" : ""}>
            <summary>${esc(f.q)}</summary>
            <p>${esc(f.a)}</p>
          </details>`
        ).join("")}
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="lp-final">
      <div class="lp-final-inner">
        <img src="/logo-hood-512.png" width="72" height="72" alt="" class="lp-final-logo" />
        <h2>Give your wallet an agent desk it can actually use.</h2>
        <p>Connect. Spend free credits. Scale with on-chain top-ups.</p>
        <div class="lp-hero-cta">
          <a class="lp-btn primary xl" href="${esc(APP_HREF)}">Launch HoodAgent</a>
          <a class="lp-btn ghost xl" href="${esc(APP_HREF)}">Log in with wallet</a>
        </div>
      </div>
    </section>

    <footer class="lp-foot">
      <div class="lp-foot-brand">
        <img src="/logo-hood-512.png" width="28" height="28" alt="" />
        <div>
          <strong>HoodAgent</strong>
          <span>Wallet · credits · agents · $HOOD</span>
        </div>
      </div>
      <div class="lp-foot-cols">
        <div>
          <b>Product</b>
          <a href="${esc(APP_HREF)}">App</a>
          <a href="#agents">Agents</a>
          <a href="#faq">FAQ</a>
        </div>
        <div>
          <b>Network</b>
          <span>Robinhood Chain</span>
        </div>
        <div>
          <b>Credits</b>
          <span>$HOOD</span>
          <span>Not financial advice</span>
        </div>
      </div>
      <p class="lp-copy">© ${new Date().getFullYear()} HoodAgent</p>
    </footer>
  </div>`;

  // mobile drawer
  const burger = root.querySelector("#lp-burger");
  const drawer = root.querySelector("#lp-drawer");
  burger?.addEventListener("click", () => {
    const open = drawer.hasAttribute("hidden");
    if (open) drawer.removeAttribute("hidden");
    else drawer.setAttribute("hidden", "");
    burger.classList.toggle("open", open);
  });
  drawer?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      drawer.setAttribute("hidden", "");
      burger?.classList.remove("open");
    })
  );

  // hero mode switcher
  const labelEl = root.querySelector("#hero-label");
  const lineEl = root.querySelector("#hero-line");
  const statusEl = root.querySelector("#device-status");
  const modes = root.querySelectorAll(".lp-mode");
  let idx = 0;
  let timer;

  function applyMode(i) {
    idx = i;
    const m = HERO_MODES[i];
    modes.forEach((b, j) => {
      b.classList.toggle("on", j === i);
      b.setAttribute("aria-selected", j === i ? "true" : "false");
    });
    if (labelEl) {
      labelEl.classList.remove("pop");
      void labelEl.offsetWidth;
      labelEl.textContent = m.label;
      labelEl.classList.add("pop");
    }
    if (lineEl) lineEl.textContent = m.line;
    if (statusEl) statusEl.textContent = `${m.label} Connected`;
  }

  modes.forEach((b, i) =>
    b.addEventListener("click", () => {
      applyMode(i);
      clearInterval(timer);
      timer = setInterval(() => applyMode((idx + 1) % HERO_MODES.length), 4200);
    })
  );
  timer = setInterval(() => applyMode((idx + 1) % HERO_MODES.length), 4200);

  // pause marquee on hover (css handles; optional reduce motion)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.querySelectorAll(".lp-marquee-track").forEach((el) => {
      el.style.animation = "none";
    });
    clearInterval(timer);
  }
}
