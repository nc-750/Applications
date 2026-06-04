import type {
  PersonaJSON,
  PersonalityTrait,
  Skill,
  Strength,
  Weakness,
  CareerEntry,
  NonProfessionalEntry,
} from "../types/persona";
import { esc, groupSkills } from "./html";

/**
 * Deterministic renderer: PersonaJSON → self-contained private insight HTML.
 * No LLM calls. Same input always produces the same HTML structure.
 *
 * Styling uses enclosure.css tokens and class names exclusively.
 * Layout utilities (flex, gap, margin, padding) are defined in the style block
 * since standalone HTML cannot load Tailwind.
 */
export function renderInsight(persona: PersonaJSON): string {
  const p = persona.persona;
  const name = p.identity.name;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const date = new Date(p.metadata.generated_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const skillsByCategory = groupSkills(p.skills ?? []);
  const traitRows = (p.personality_traits ?? []).map(renderTrait).join("");
  const strengthCards = (p.strengths ?? []).map(renderStrength).join("");
  const weaknessCards = (p.weaknesses ?? []).map(renderWeakness).join("");
  const timelineItems = (p.career_timeline ?? []).map(renderTimelineEntry).join("");
  const nonProfItems = (p.non_professional ?? []).map(renderNonProf).join("");
  const hiddenItems = (p.hidden_assets ?? []).map((a) => `<li>${esc(a)}</li>`).join("");
  const valuesTags = (p.values ?? []).map((v) => `<span class="nc-badge insight-tag">${esc(v)}</span>`).join("");
  const sources = (p.metadata.sources_used ?? []).join(", ");

  return `<!DOCTYPE html>
<html lang="${esc(p.metadata.language ?? "en")}" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
<title>Mirror Insight — ${esc(name)}</title>
<style>
  /* ============================================================
     Enclosure.css tokens — dark theme (the insight is always dark)
     Seed H/S/L tuned to match the original insight amber-on-charcoal
     palette. Accent = warm amber.
     ============================================================ */
  :root {
    --nc-seed-h: 213;
    --nc-seed-s: 13;
    --nc-seed-l: 56;
    --nc-accent-h: 38;
    --nc-accent-s: 100;
    --nc-accent-l: 53;

    /* Surface ramp — dark */
    --nc-bg:          hsl(214 8% 13%);
    --nc-bg-sunken:   hsl(214 10% 9%);
    --nc-panel:       hsl(213 6% 18%);
    --nc-panel-2:     hsl(213 6% 16%);
    --nc-panel-3:     hsl(214 6% 14%);
    --nc-inset:       hsl(214 8% 10%);
    --nc-hover:       hsl(213 5% 22%);
    --nc-active:      hsl(213 5% 26%);

    /* Console / display surface */
    --nc-console:     hsl(215 8% 7%);
    --nc-console-2:   hsl(214 7% 11%);
    --nc-console-line:hsl(213 5% 24%);

    /* Ink — near-white on dark */
    --nc-ink:         hsl(214 8% 91%);
    --nc-ink-2:       hsl(213 4% 68%);
    --nc-ink-3:       hsl(214 3% 48%);
    --nc-ink-faint:   hsl(214 3% 38%);
    --nc-ink-invert:  hsl(214 8% 92%);
    --nc-ink-invert-2:hsl(213 3% 55%);

    /* Seams */
    --nc-line:        hsl(213 4% 26%);
    --nc-line-subtle: hsl(213 4% 20%);
    --nc-line-strong: hsl(213 5% 36%);
    --nc-line-ink:    hsl(214 8% 88%);

    /* Accent — warm amber signal */
    --nc-accent:          hsl(38 100% 53%);
    --nc-accent-hover:    hsl(38 100% 58%);
    --nc-accent-active:   hsl(36 92% 45%);
    --nc-accent-ink:      hsl(37 88% 38%);
    --nc-accent-subtle:   hsl(38 100% 53% / 0.14);
    --nc-on-accent:       hsl(38 60% 8%);

    /* Accent-dim — the old "ember-dim" for subtle accent backgrounds */
    --nc-accent-dim:      hsl(38 70% 12% / 0.85);

    /* Semantic */
    --nc-success:     hsl(150 42% 50%);
    --nc-success-subtle: hsl(150 42% 50% / 0.14);
    --nc-warning:     hsl(40 92% 56%);
    --nc-warning-subtle: hsl(40 92% 56% / 0.14);
    --nc-error:       hsl(4 82% 60%);
    --nc-error-subtle: hsl(4 82% 60% / 0.14);
    --nc-info:        hsl(206 70% 58%);
    --nc-info-subtle: hsl(206 70% 58% / 0.14);

    /* Typography */
    --nc-font-display: system-ui, -apple-system, "Segoe UI", sans-serif;
    --nc-font-body:    system-ui, -apple-system, "Segoe UI", sans-serif;
    --nc-font-mono:    ui-monospace, "Cascadia Code", "Consolas", monospace;

    --nc-text-2xs:  0.6875rem;
    --nc-text-xs:   0.75rem;
    --nc-text-sm:   0.8125rem;
    --nc-text-base: 0.875rem;
    --nc-text-md:   1rem;
    --nc-text-lg:   1.125rem;
    --nc-text-xl:   1.375rem;
    --nc-text-2xl:  1.75rem;
    --nc-text-3xl:  2.25rem;
    --nc-text-4xl:  3.25rem;

    --nc-font-light:    300;
    --nc-font-regular:  400;
    --nc-font-medium:   500;
    --nc-font-semibold: 600;
    --nc-font-bold:     700;

    --nc-leading-none:    1;
    --nc-leading-tight:   1.08;
    --nc-leading-snug:    1.28;
    --nc-leading-normal:  1.5;
    --nc-leading-relaxed: 1.7;

    --nc-track-display: -0.035em;
    --nc-track-tight:   -0.015em;
    --nc-track-normal:   0;
    --nc-track-label:    0.14em;
    --nc-track-mono:     0.04em;

    /* Spacing — 4px grid */
    --nc-space-1:  4px;
    --nc-space-2:  8px;
    --nc-space-3:  12px;
    --nc-space-4:  16px;
    --nc-space-5:  20px;
    --nc-space-6:  24px;
    --nc-space-8:  32px;
    --nc-space-10: 40px;
    --nc-space-12: 48px;
    --nc-space-16: 64px;
    --nc-space-20: 80px;

    /* Radii */
    --nc-radius-sm:   3px;
    --nc-radius-md:   5px;
    --nc-radius-lg:   10px;
    --nc-radius-xl:   16px;
    --nc-radius-full: 9999px;

    --nc-border-width: 1px;
    --nc-transition-fast: 90ms cubic-bezier(0.4, 0, 0.2, 1);

    /* Edge lighting — for panels */
    --nc-edge-raised: inset 0 1px 0 hsl(0 0% 100% / 0.07),
                      inset 0 -1px 0 hsl(220 20% 0% / 0.4);
    --nc-edge-inset:  inset 0 1px 2px hsl(220 30% 0% / 0.5),
                      inset 0 -1px 0 hsl(0 0% 100% / 0.04);
  }

  /* ── Reset ───────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--nc-bg);
    color: var(--nc-ink);
    font-family: var(--nc-font-body);
    font-size: 15px;
    line-height: var(--nc-leading-relaxed);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Page container ──────────────────────────────────── */
  .page { max-width: 820px; margin: 0 auto; padding: 48px 28px 96px; }

  /* ════════════════════════════════════════════════════════
     Enclosure.css component classes (subset used by insight)
     ════════════════════════════════════════════════════════ */

  /* ── Panel ───────────────────────────────────────────── */
  .nc-panel {
    background: var(--nc-panel);
    border: var(--nc-border-width) solid var(--nc-line);
    border-radius: var(--nc-radius-md);
    padding: var(--nc-space-4);
    box-shadow: var(--nc-edge-raised);
  }

  /* ── Badge / Pill ────────────────────────────────────── */
  .nc-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--nc-space-1);
    height: 20px;
    padding: 0 var(--nc-space-2);
    font-family: var(--nc-font-mono);
    font-size: var(--nc-text-2xs);
    font-weight: var(--nc-font-medium);
    letter-spacing: var(--nc-track-mono);
    text-transform: uppercase;
    line-height: 1;
    color: var(--nc-ink-2);
    background: var(--nc-panel-2);
    border: var(--nc-border-width) solid var(--nc-line);
    border-radius: var(--nc-radius-sm);
    white-space: nowrap;
  }
  .nc-badge--accent {
    color: var(--nc-on-accent);
    background: var(--nc-accent);
    border-color: var(--nc-accent-active);
  }

  /* ── Typography ──────────────────────────────────────── */
  .nc-text-sm     { font-size: var(--nc-text-sm); }
  .nc-text-xs     { font-size: var(--nc-text-xs); }
  .nc-text-2xs    { font-size: var(--nc-text-2xs); }
  .nc-text-muted  { color: var(--nc-ink-3); }
  .nc-text-secondary { color: var(--nc-ink-2); }
  .nc-font-medium   { font-weight: var(--nc-font-medium); }
  .nc-font-semibold { font-weight: var(--nc-font-semibold); }
  .nc-font-bold     { font-weight: var(--nc-font-bold); }

  .nc-label {
    font-family: var(--nc-font-mono);
    font-size: var(--nc-text-2xs);
    font-weight: var(--nc-font-medium);
    letter-spacing: var(--nc-track-label);
    text-transform: uppercase;
    color: var(--nc-ink-3);
  }

  /* ── Heading ─────────────────────────────────────────── */
  .nc-heading-4 {
    font-family: var(--nc-font-display);
    font-size: var(--nc-text-xl);
    font-weight: var(--nc-font-semibold);
    line-height: var(--nc-leading-tight);
    letter-spacing: var(--nc-track-tight);
    color: var(--nc-ink);
  }

  /* ════════════════════════════════════════════════════════
     Insight-specific structural classes
     (no enclosure.css equivalent — domain layout only)
     ════════════════════════════════════════════════════════ */

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--nc-ink);
  }

  h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--nc-ink);
    margin-bottom: 5px;
  }

  p { color: var(--nc-ink-2); }

  section { margin-bottom: 56px; }

  /* ── Avatar ─────────────────────────────────────────── */
  .insight-avatar {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    background: var(--nc-accent-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--nc-accent);
    flex-shrink: 0;
  }

  .header-row { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 6px; }

  .tagline { color: var(--nc-ink-2); font-size: 0.9375rem; margin-top: 4px; }

  .meta { color: var(--nc-ink-3); font-size: 0.8rem; margin-top: 6px; }

  /* ── Private badge ──────────────────────────────────── */
  .private-badge {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--nc-accent-dim);
    color: var(--nc-accent);
    margin-left: 10px;
    vertical-align: middle;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ── Quote (elevator pitch) ─────────────────────────── */
  .quote {
    background: var(--nc-panel);
    border: 1px solid var(--nc-line);
    border-radius: 6px;
    padding: 20px 24px;
    font-style: italic;
    font-size: 1.05rem;
    color: var(--nc-ink-2);
    line-height: 1.85;
  }

  /* ── Card (strength, weakness, timeline, non-prof) ──── */
  .insight-card {
    background: var(--nc-panel);
    border: var(--nc-border-width) solid var(--nc-line);
    border-radius: 6px;
    padding: 18px 22px;
    margin-bottom: 10px;
  }

  /* ── Evidence / growth notes ────────────────────────── */
  .evidence {
    font-size: 0.83rem;
    color: var(--nc-ink-3);
    margin-top: 10px;
    font-style: italic;
    padding: 8px 12px;
    background: var(--nc-accent-dim);
    border-radius: 4px;
  }

  .growth-note {
    font-size: 0.83rem;
    color: var(--nc-ink-3);
    margin-top: 8px;
  }

  /* ── Skills ─────────────────────────────────────────── */
  .skills-grid { display: flex; flex-wrap: wrap; gap: 7px; }

  .skill-badge {
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .skill-pro      { background: var(--nc-accent-dim); color: var(--nc-accent); }
  .skill-personal { background: var(--nc-panel-2);    color: var(--nc-ink-2); }
  .skill-inferred { background: var(--nc-line);       color: var(--nc-ink-3); }

  .cat-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--nc-ink-3);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 20px 0 8px;
  }
  .cat-label:first-child { margin-top: 0; }

  /* ── Skills legend ──────────────────────────────────── */
  .skills-legend {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    font-size: var(--nc-text-sm);
    color: var(--nc-ink-3);
    margin-top: var(--nc-space-5);
  }
  .skills-legend-dot {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  /* ── Timeline ───────────────────────────────────────── */
  .tl-year-range {
    font-size: 0.82rem;
    color: var(--nc-ink-3);
    flex-shrink: 0;
  }

  .real-story {
    font-size: 0.85rem;
    color: var(--nc-ink-3);
    margin-top: 10px;
    padding: 10px 14px;
    background: var(--nc-panel-2);
    border: 1px solid var(--nc-line);
    border-radius: 4px;
    font-style: italic;
  }

  /* ── Personality traits ─────────────────────────────── */
  .trait-row { margin-bottom: 18px; }
  .trait-row:last-child { margin-bottom: 0; }

  .trait-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nc-ink);
    margin-bottom: 7px;
    display: flex;
    justify-content: space-between;
  }

  .trait-score { color: var(--nc-ink-3); font-size: 0.8rem; }

  .trait-bar-bg {
    background: var(--nc-line);
    border-radius: 3px;
    height: 5px;
  }

  .trait-bar-fill {
    height: 5px;
    border-radius: 3px;
    background: var(--nc-accent);
  }

  .trait-note { font-size: 0.8rem; color: var(--nc-ink-3); margin-top: 5px; }

  /* ── Goals ──────────────────────────────────────────── */
  .goals-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: var(--nc-space-5);
  }
  @media (max-width: 560px) { .goals-grid { grid-template-columns: 1fr; } }

  .goal-card {
    background: var(--nc-panel);
    border: 1px solid var(--nc-line);
    border-radius: 6px;
    padding: 16px 20px;
  }

  .goal-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--nc-accent);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 8px;
  }

  /* ── Values tags ────────────────────────────────────── */
  .insight-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 500;
    background: var(--nc-accent-dim);
    color: var(--nc-accent);
    margin: 3px;
    font-family: var(--nc-font-body);
    text-transform: none;
    letter-spacing: normal;
    height: auto;
    border: none;
  }

  /* ── Ready-to-use text (details) ────────────────────── */
  details { margin-bottom: 10px; }

  summary {
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--nc-ink);
    padding: 12px 16px;
    background: var(--nc-panel);
    border: 1px solid var(--nc-line);
    border-radius: 6px;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
  }

  summary::-webkit-details-marker { display: none; }

  summary::after {
    content: '▸';
    font-size: 0.8rem;
    color: var(--nc-accent);
    transition: transform 0.15s ease-out;
  }

  details[open] summary {
    border-radius: 6px 6px 0 0;
    border-bottom-color: transparent;
  }

  details[open] summary::after { transform: rotate(90deg); }

  .details-body {
    background: var(--nc-panel);
    border: 1px solid var(--nc-line);
    border-top: none;
    border-radius: 0 0 6px 6px;
    padding: 16px;
    font-size: 0.9rem;
    color: var(--nc-ink-2);
    white-space: pre-wrap;
    font-family: inherit;
    line-height: 1.7;
  }

  /* ── Non-professional ───────────────────────────────── */
  .non-prof-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

  .np-skill {
    font-size: 0.78rem;
    padding: 3px 10px;
    border-radius: 12px;
    background: var(--nc-panel-2);
    color: var(--nc-ink-2);
  }

  /* ── Lists ──────────────────────────────────────────── */
  ul { padding-left: 1.25em; }
  ul li { margin-bottom: 6px; color: var(--nc-ink-2); }

  /* ── Footer ─────────────────────────────────────────── */
  footer {
    text-align: center;
    font-size: 0.78rem;
    color: var(--nc-ink-3);
    border-top: 1px solid var(--nc-line);
    padding-top: 24px;
    margin-top: 56px;
  }

  /* ════════════════════════════════════════════════════════
     Layout utilities (Tailwind-alike — standalone HTML only)
     ════════════════════════════════════════════════════════ */
  .flex       { display: flex; }
  .flex-wrap  { flex-wrap: wrap; }
  .flex-1     { flex: 1; }
  .items-start   { align-items: flex-start; }
  .items-center  { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-1   { gap: 4px; }
  .gap-2   { gap: 8px; }
  .gap-5   { gap: 20px; }
  .mt-0\.5 { margin-top: 2px; }
  .mt-1    { margin-top: 4px; }
  .mt-1\.5 { margin-top: 6px; }
  .mt-2\.5 { margin-top: 10px; }
  .mt-3    { margin-top: 12px; }
  .pb-2    { padding-bottom: 8px; }
</style>
</head>
<body>
<div class="page">

  <!-- 1. Header -->
  <section id="section-header">
    <div class="header-row">
      <div class="insight-avatar">${esc(initials)}</div>
      <div>
        <h1>${esc(name)}<span class="private-badge">Private</span></h1>
        <div class="tagline">${esc(p.identity.tagline)}</div>
        <div class="meta">Sources: ${esc(sources)}&ensp;&middot;&ensp;Generated ${esc(date)}</div>
      </div>
    </div>
  </section>

  <!-- 2. Elevator Pitch -->
  <section id="section-brief">
    <h2 class="nc-label">Elevator Pitch</h2>
    <div class="quote">${esc(p.identity.elevator_pitch)}</div>
  </section>

  <!-- 3. Strengths -->
  ${strengthCards ? `<section id="section-strengths">
    <h2 class="nc-label">Strengths</h2>
    ${strengthCards}
  </section>` : ""}

  <!-- 4. Growth Areas -->
  ${(p.weaknesses ?? []).length ? `<section id="section-weaknesses">
    <h2 class="nc-label">Growth Areas</h2>
    ${weaknessCards}
  </section>` : ""}

  <!-- 5. Skills Map -->
  ${p.skills?.length ? `<section id="section-skills">
    <h2 class="nc-label">Skills Map</h2>
    ${renderSkillsMap(skillsByCategory)}
    <div class="skills-legend">
      <span><span class="skills-legend-dot skill-pro">●</span>&ensp;Professional</span>
      <span><span class="skills-legend-dot skill-personal">●</span>&ensp;Personal / self-taught</span>
      <span><span class="skills-legend-dot skill-inferred">●</span>&ensp;Inferred / transversal</span>
    </div>
  </section>` : ""}

  <!-- 6. Career Timeline -->
  ${p.career_timeline?.length ? `<section id="section-career">
    <h2 class="nc-label">Career Timeline</h2>
    ${timelineItems}
  </section>` : ""}

  <!-- 7. Outside Work -->
  ${nonProfItems ? `<section id="section-outside-work">
    <h2 class="nc-label">Outside Work</h2>
    ${nonProfItems}
  </section>` : ""}

  <!-- 8. Hidden Assets -->
  ${hiddenItems ? `<section id="section-hidden-assets">
    <h2 class="nc-label">Hidden Assets</h2>
    <div class="insight-card">
      <ul>${hiddenItems}</ul>
    </div>
  </section>` : ""}

  <!-- 9. Personality Dimensions -->
  ${traitRows ? `<section id="section-personality">
    <h2 class="nc-label">Personality Dimensions</h2>
    <div class="insight-card">
      ${traitRows}
    </div>
  </section>` : ""}

  <!-- 10. Values & Goals -->
  <section id="section-values">
    <h2 class="nc-label">Values</h2>
    <div>${valuesTags}</div>
    ${(p.goals?.short_term || p.goals?.long_term) ? `
    <div class="goals-grid">
      ${p.goals.short_term ? `<div class="goal-card"><div class="goal-label">Short-term</div><p>${esc(p.goals.short_term)}</p></div>` : ""}
      ${p.goals.long_term ? `<div class="goal-card"><div class="goal-label">Long-term</div><p>${esc(p.goals.long_term)}</p></div>` : ""}
    </div>` : ""}
  </section>

  <!-- 11. Ready-to-use Text -->
  ${hasUseCases(p.use_cases) ? `<section id="section-use-cases">
    <h2 class="nc-label">Ready-to-use Text</h2>
    ${p.use_cases.cv_summary ? `<details><summary>CV Summary</summary><div class="details-body">${esc(p.use_cases.cv_summary)}</div></details>` : ""}
    ${p.use_cases.interview_pitch ? `<details><summary>60-second Interview Pitch</summary><div class="details-body">${esc(p.use_cases.interview_pitch)}</div></details>` : ""}
    ${p.use_cases.linkedin_about ? `<details><summary>LinkedIn About</summary><div class="details-body">${esc(p.use_cases.linkedin_about)}</div></details>` : ""}
  </section>` : ""}

  <footer>Mirror Insight &middot; Private document &middot; ${esc(date)}</footer>
</div>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderStrength(s: Strength): string {
  return `<div class="insight-card">
    <h3>${esc(s.label)}</h3>
    <p>${esc(s.description)}</p>
    ${s.evidence ? `<p class="evidence">${esc(s.evidence)}</p>` : ""}
  </div>`;
}

function renderWeakness(w: Weakness): string {
  return `<div class="insight-card">
    <h3>${esc(w.label)}</h3>
    <p>${esc(w.description)}</p>
    ${w.growth_note ? `<div class="growth-note">→ ${esc(w.growth_note)}</div>` : ""}
  </div>`;
}

function renderSkillsMap(grouped: Map<string, Skill[]>): string {
  let html = "";
  for (const [cat, skills] of grouped) {
    html += `<div class="cat-label">${esc(cat)}</div><div class="skills-grid">`;
    for (const skill of skills) {
      const cls =
        skill.source === "personal"
          ? "skill-personal"
          : skill.source === "inferred"
          ? "skill-inferred"
          : "skill-pro";
      const level = skill.level ? ` · ${skill.level}` : "";
      html += `<span class="skill-badge ${cls}">${esc(skill.name)}${esc(level)}</span>`;
    }
    html += `</div>`;
  }
  return html;
}

function renderTimelineEntry(e: CareerEntry): string {
  const yearEnd = e.year_end === "present" ? "Present" : String(e.year_end);
  const yearStart = String(Number(e.year_start) || "");
  return `<div class="insight-card">
    <div class="flex justify-between items-start flex-wrap gap-2">
      <div>
        <h3>${esc(e.role)}</h3>
        <div class="nc-text-muted nc-text-sm mt-0\.5">${esc(e.organization)}</div>
      </div>
      <span class="tl-year-range">${esc(yearStart)}&thinsp;&ndash;&thinsp;${esc(yearEnd)}</span>
    </div>
    ${e.highlight ? `<p class="mt-2\.5">${esc(e.highlight)}</p>` : ""}
    ${e.real_story ? `<div class="real-story">${esc(e.real_story)}</div>` : ""}
  </div>`;
}

function renderNonProf(n: NonProfessionalEntry): string {
  const skillTags = (n.skills_revealed ?? [])
    .map((s) => `<span class="np-skill">${esc(s)}</span>`)
    .join("");
  return `<div class="insight-card">
    <h3>${esc(n.activity)}</h3>
    ${n.note ? `<p class="mt-1">${esc(n.note)}</p>` : ""}
    ${skillTags ? `<div class="non-prof-skills">${skillTags}</div>` : ""}
  </div>`;
}

function renderTrait(t: PersonalityTrait): string {
  const pos = Math.max(0, Math.min(10, t.position ?? 5));
  const pct = (pos / 10) * 100;
  return `<div class="trait-row">
    <div class="trait-label">
      <span>${esc(t.dimension)}</span>
      <span class="trait-score">${pos}/10</span>
    </div>
    <div class="trait-bar-bg">
      <div class="trait-bar-fill" style="width:${pct}%"></div>
    </div>
    ${t.note ? `<div class="trait-note">${esc(t.note)}</div>` : ""}
  </div>`;
}

function hasUseCases(uc: PersonaJSON["persona"]["use_cases"]): boolean {
  return !!(uc?.cv_summary || uc?.interview_pitch || uc?.linkedin_about);
}
