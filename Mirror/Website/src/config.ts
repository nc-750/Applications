// ── Mirror (NODE-0M) marketing site config ─────────────────────────────────────
// All human-editable copy in one place. Change strings here — no Astro
// knowledge needed. Hot reload picks up changes immediately in dev.
// ──────────────────────────────────────────────────────────────────────────

export const SITE = {
  title: "Mirror",
  tagline: "Your career, understood honestly.",
  description:
    "Mirror interviews you with AI, finds patterns you missed, and produces a private insight document and a polished public profile. Your data stays yours — local-first, with a fully offline option.",
  url: "https://mirror.nc750.com",
  author: "Alex Vendinois",
  version: "0.1.0",
};

// Pricing is HYPOTHESIS-stage — validate willingness to pay before committing.
// See mirror/PRICING.md (full spec) and mirror/MEASUREMENT.md (Approach E).
export const PRICING = {
  free: {
    price: "$0",
    label: "Free forever. No account, no card.",
  },
  jobSeeker: {
    price: "$9–15 / mo", // HYPOTHESIS — validate
    label: "Cancel anytime — we'll even remind you to cancel once you've landed.",
    // TODO: Replace with your real LemonSqueezy subscription checkout URL
    checkoutUrl: "https://vendinois.lemonsqueezy.com/checkout/buy/REPLACE_ME",
  },
  coach: {
    price: "Per seat",
    label: "For coaches, outplacement firms, and career centers. Volume pricing, billed annually.",
    // TODO: Replace with your real Coach checkout or contact route
    contactUrl: "mailto:hello@nc750.com?subject=Mirror%20Coach%20plan",
  },
};

export const DOWNLOAD = {
  // Mirror is not open source — there is no public GitHub releases page.
  // TODO: Replace with the real desktop binary host (CDN / S3 / your own release endpoint).
  desktopUrl: "https://mirror.nc750.com/releases", // REPLACE_ME with real download host
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
      { label: "Compare plans", href: "/#compare" },
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
      "A conversational AI interviewer goes deep on your career — no rigid question limit. Included with Job Seeker, or run it on your own AI key. (Free gives you a first read from one file, without the interview.)",
  },
  {
    step: 3,
    title: "Get your mirror",
    description:
      "Two documents, rendered instantly: a private Insight for self-knowledge, and a polished public Profile for sharing. Download as standalone HTML.",
  },
];

// Free vs Job Seeker. Note: interview DEPTH is never throttled — the interview is
// simply present (Job Seeker / BYOK) or absent (Free). Paid sells features, not a
// de-crippled core. See mirror/PRICING.md.
export const COMPARISON_FEATURES = [
  {
    feature: "Starting point",
    free: "One file (CV, export, or notes)",
    jobSeeker: "Your files + a full AI interview",
  },
  {
    feature: "AI interview",
    free: "Not included",
    jobSeeker: "Full depth — conversational, no question limit",
  },
  {
    feature: "Persona depth",
    free: "Basic — from your one file",
    jobSeeker: "Deep — excavated across your whole story",
  },
  {
    feature: "Private Insight",
    free: "Full document (from a basic persona)",
    jobSeeker: "Full document (from a deep persona)",
  },
  {
    feature: "Public Profile",
    free: "Full document",
    jobSeeker: "Full document + theme editor",
  },
  {
    feature: "Mock interview practice",
    free: "—",
    jobSeeker: "Included",
  },
  {
    feature: "Saved personas",
    free: "One",
    jobSeeker: "Multiple",
  },
  {
    feature: "AI provider",
    free: "Hosted — zero setup",
    jobSeeker: "Hosted zero setup, or bring your own key",
  },
  {
    feature: "Account / card",
    free: "None",
    jobSeeker: "Subscription via payment processor; no in-app account",
  },
];
