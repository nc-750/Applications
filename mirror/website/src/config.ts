// ── Mirror (NODE-0M) marketing site config ─────────────────────────────────────
// All human-editable copy in one place. Change strings here — no Astro
// knowledge needed. Hot reload picks up changes immediately in dev.
// ──────────────────────────────────────────────────────────────────────────

export const SITE = {
  title: "Mirror",
  tagline: "Your career, understood honestly.",
  description:
    "Mirror interviews you with AI, finds patterns you missed, and produces a private insight document and a polished public profile. Nothing leaves your device.",
  url: "https://mirror.nc750.com",
  author: "Alex Vendinois",
  version: "0.1.0",
};

export const PRICING = {
  proPriceRange: "$29–49",
  proPriceLabel: "One-time purchase. No subscription. No recurring fees.",
  // TODO: Replace with your real LemonSqueezy checkout variant ID from your store dashboard
  lemonSqueezyUrl: "https://vendinois.lemonsqueezy.com/checkout/buy/REPLACE_ME",
  freeLabel: "Free forever.",
};

export const DOWNLOAD = {
  githubReleases: "https://github.com/vendinois/mirror/releases",
  pwaUrl: "https://mirror.nc750.com/app",
  platforms: ["Windows", "macOS", "Linux"] as const,
};

export const NAV: { label: string; href: string }[] = [
  { label: "Docs", href: "/docs/user-guide" },
  { label: "Download", href: "/download" },
];

export const FOOTER_LINK_GROUPS = [
  {
    title: "Docs",
    links: [
      { label: "User Guide", href: "/docs/user-guide" },
      { label: "Provider Setup", href: "/docs/provider-setup" },
      { label: "Privacy", href: "/docs/privacy" },
      { label: "FAQ", href: "/docs/faq" },
    ],
  },
  {
    title: "App",
    links: [
      { label: "Download", href: "/download" },
      { label: "Free vs Pro", href: "/#compare" },
      { label: "GitHub", href: "https://github.com/vendinois/mirror" },
    ],
  },
];

export const LANDING_FEATURES = [
  {
    title: "Private by design",
    description:
      "No server. No account. Your data stays on your device; you bring your own AI key. Stored securely on your device.",
  },
  {
    title: "Honest over marketing",
    description:
      "The private Insight tells you what you need to hear: growth areas, patterns, blind spots. The public Profile tells others what they need to know.",
  },
  {
    title: "Yours forever",
    description:
      "Download your results as self-contained HTML files. No dependencies, no lock-in, no remote resources. Open them from disk, host them, or email them; they're yours.",
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Feed it context",
    description:
      "Drop your CV, LinkedIn export, or just write freely. PDF, Markdown, text, HTML, JSON: Mirror extracts it all. The more you give, the richer the interview.",
  },
  {
    step: 2,
    title: "Get interviewed",
    description:
      "An AI interviewer, powered by your choice of model, asks structured questions about your career. Conversational, not a form. 2–3 questions free, 5–8 with Pro.",
  },
  {
    step: 3,
    title: "Get your mirror",
    description:
      "Two documents, rendered instantly: a private Insight for self-knowledge, and a polished public Profile for sharing. Download as standalone HTML.",
  },
];

export const COMPARISON_FEATURES = [
  {
    feature: "Interview depth",
    free: "2–3 questions, surface",
    pro: "5–8 questions, deep excavation across two layers",
  },
  {
    feature: '"How I Work Best"',
    free: "2 concise statements",
    pro: "3–4 nuanced statements, cross-referenced",
  },
  {
    feature: "Strengths & skills",
    free: "Identified with source",
    pro: "Richer evidence, cross-referenced across experiences",
  },
  {
    feature: "Growth areas",
    free: "Identified",
    pro: "Detailed with context and growth notes",
  },
  {
    feature: "Hidden assets",
    free: "Identified",
    pro: "Analyzed in depth, transferable skills mapped",
  },
  {
    feature: "Personality dimensions",
    free: "Core traits (0–10 scales)",
    pro: "Extended profile with nuanced analysis",
  },
  {
    feature: "Ready-to-use text",
    free: "Standard (CV summary, interview pitch, LinkedIn About)",
    pro: "Extended with variations and tailored phrasing",
  },
  {
    feature: "Insight document",
    free: "Full private insight",
    pro: "Full private insight (richer)",
  },
  {
    feature: "Profile document",
    free: "Full public profile",
    pro: "Full public profile (richer)",
  },
];
