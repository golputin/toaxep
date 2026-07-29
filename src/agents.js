/** Fallback agent list if API offline */
export const AGENTS_FALLBACK = [
  { id: "general", name: "General Assistant", blurb: "Default all-purpose chat", icon: "✦", mode: "standard", creditCost: 1 },
  { id: "web-research", name: "Web Research", blurb: "Structured research briefs", icon: "🔎", mode: "research", creditCost: 3 },
  { id: "code-review", name: "Code Review", blurb: "Security + clarity review", icon: "🧪", mode: "code", creditCost: 2 },
  { id: "crypto-tracker", name: "Crypto Tracker", blurb: "Markets, on-chain intuition", icon: "📈", mode: "defi", creditCost: 3 },
  { id: "defi-analyzer", name: "DeFi Analyzer", blurb: "Protocols, APY skepticism", icon: "🏦", mode: "defi", creditCost: 3 },
  { id: "sql-builder", name: "SQL Builder", blurb: "Queries + schema tips", icon: "🗃️", mode: "code", creditCost: 2 },
  { id: "email-drafter", name: "Email Drafter", blurb: "Tight professional copy", icon: "✉️", mode: "standard", creditCost: 1 },
  { id: "image-prompt", name: "Image Prompt Smith", blurb: "High-cost creative prompts", icon: "🎨", mode: "image-generator", creditCost: 6 },
];
