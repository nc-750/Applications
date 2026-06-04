import type { PersonaJSON, Skill, Strength, CareerEntry, NonProfessionalEntry } from "../types/persona";
import { esc, groupSkills } from "./html";

/**
 * Deterministic renderer: PersonaJSON + cached howIWorkBest → public profile HTML.
 * No LLM calls. Same input always produces the same output.
 * Excludes: weaknesses, hidden_assets, real_story, personality_traits, goals (unless opted in),
 * interview_pitch.
 */
export function renderProfile(persona: PersonaJSON, howIWorkBest: string[]): string {
  const p = persona.persona;
  const name = p.identity.name;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const strengthCards = (p.strengths ?? [])
    .slice(0, 5)
    .map(renderStrength)
    .join("");

  const timelineItems = (p.career_timeline ?? []).map(renderTimelineEntry).join("");
  const beyondItems = (p.non_professional ?? []).slice(0, 4).map(renderBeyond).join("");
  const howBullets = howIWorkBest.map((s) => `<li>${esc(s)}</li>`).join("");

  // Skills: group by category, omit "inferred" source
  const skills = (p.skills ?? []).filter((s) => s.source !== "inferred");
  const skillsByCategory = groupSkills(skills);

  return `<!DOCTYPE html>
<html lang="${esc(p.metadata.language ?? "en")}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
<title>${esc(name)}</title>
<style>
  /* Templates with custom fonts: planned, not yet implemented */
  :root {
    --bg: #fafaf9; --surface: #ffffff; --border: #e7e5e4;
    --accent: #6366f1; --accent2: #8b5cf6; --text: #1c1917;
    --muted: #78716c; --radius: 12px;
    --font: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0c0a09; --surface: #1c1917; --border: #292524; --text: #fafaf9; --muted: #a8a29e; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--font);
    font-size: 15px; line-height: 1.75; }
  .page { max-width: 900px; margin: 0 auto; padding: 0 24px 80px; }
  /* Hero */
  .hero { padding: 64px 0 52px; border-bottom: 1px solid var(--border); margin-bottom: 52px; }
  .hero-inner { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
  .avatar { width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; font-weight: 700; color: #fff; flex-shrink: 0; }
  .hero-text h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -.02em; }
  .hero-tagline { color: var(--muted); font-size: 1.05rem; margin-top: 4px; }
  /* Sections */
  section { margin-bottom: 56px; }
  h2 { font-size: 1.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
    color: var(--accent); margin-bottom: 20px; }
  h3 { font-size: 1rem; font-weight: 600; margin-bottom: 4px; }
  .card { background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px 24px; margin-bottom: 12px; }
  /* About */
  .about-text { font-size: 1.05rem; line-height: 1.9; max-width: 680px; }
  /* How I Work Best */
  .how-list { list-style: none; }
  .how-list li { padding: 12px 0; border-bottom: 1px solid var(--border); }
  .how-list li:last-child { border-bottom: none; }
  .how-list li::before { content: '→ '; color: var(--accent); font-weight: 600; }
  /* Strengths */
  .evidence { font-size: .85rem; color: var(--muted); margin-top: 6px;
    padding: 8px 12px; background: rgba(99,102,241,.06); border-radius: 6px; }
  /* Skills */
  .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .skill-badge { padding: 5px 14px; border-radius: 20px; font-size: .83rem; font-weight: 500; }
  .skill-pro { background: rgba(99,102,241,.08); color: var(--accent);
    border: 1px solid rgba(99,102,241,.2); }
  .skill-personal { background: rgba(16,185,129,.08); color: #059669;
    border: 1px solid rgba(16,185,129,.2); }
  .cat-label { font-size: .78rem; font-weight: 600; color: var(--muted);
    text-transform: uppercase; letter-spacing: .06em; margin: 14px 0 8px; }
  /* Timeline */
  .tl-entry { display: flex; gap: 20px; margin-bottom: 24px; align-items: flex-start; }
  .tl-dot-col { display: flex; flex-direction: column; align-items: center; padding-top: 6px; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .tl-line { flex: 1; width: 2px; background: var(--border); margin-top: 4px; min-height: 20px; }
  .tl-year { font-size: .83rem; color: var(--muted); margin-top: 2px; white-space: nowrap; }
  /* Beyond work */
  .beyond-card { padding: 16px 20px; }
  /* Footer */
  footer { border-top: 1px solid var(--border); padding-top: 24px; margin-top: 48px;
    font-size: .82rem; color: var(--muted); display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 8px; }
  @media (max-width: 600px) {
    .hero-text h1 { font-size: 1.6rem; }
    .hero-inner { gap: 16px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- 1. Hero -->
  <div class="hero">
    <div class="hero-inner">
      <div class="avatar">${esc(initials)}</div>
      <div class="hero-text">
        <h1>${esc(name)}</h1>
        <div class="hero-tagline">${esc(p.identity.tagline)}</div>
      </div>
    </div>
  </div>

  <!-- 2. About -->
  <section id="section-brief">
    <h2>About</h2>
    <p class="about-text">${esc(p.identity.elevator_pitch)}</p>
  </section>

  <!-- 3. How I Work Best -->
  ${howBullets ? `<section id="section-how-i-work-best">
    <h2>How I Work Best</h2>
    <div class="card" style="padding: 8px 24px;">
      <ul class="how-list">${howBullets}</ul>
    </div>
  </section>` : ""}

  <!-- 4. Strengths -->
  ${strengthCards ? `<section id="section-strengths">
    <h2>Strengths</h2>
    ${strengthCards}
  </section>` : ""}

  <!-- 5. Skills -->
  ${skillsByCategory.size ? `<section id="section-skills">
    <h2>Skills</h2>
    ${renderSkillsMap(skillsByCategory)}
    <div style="margin-top:14px; display:flex; gap:16px; flex-wrap:wrap; font-size:.82rem; color:var(--muted);">
      <span><span style="color:var(--accent);">●</span> Professional</span>
      <span><span style="color:#059669;">●</span> Personal / self-taught</span>
    </div>
  </section>` : ""}

  <!-- 6. Career -->
  ${timelineItems ? `<section id="section-experience">
    <h2>Experience</h2>
    ${timelineItems}
  </section>` : ""}

  <!-- 7. Beyond Work -->
  ${beyondItems ? `<section id="section-beyond-work">
    <h2>Beyond Work</h2>
    ${beyondItems}
  </section>` : ""}

  <!-- Footer -->
  <footer>
    <span>${esc(name)}</span>
    <span>Built with Mirror</span>
  </footer>
</div>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderStrength(s: Strength): string {
  return `<div class="card">
    <h3>${esc(s.label)}</h3>
    <p>${esc(s.description)}</p>
    ${s.evidence ? `<div class="evidence">${esc(s.evidence)}</div>` : ""}
  </div>`;
}

function renderSkillsMap(grouped: Map<string, Skill[]>): string {
  let html = "";
  for (const [cat, skills] of grouped) {
    html += `<div class="cat-label">${esc(cat)}</div><div class="skills-grid">`;
    for (const skill of skills) {
      const cls = skill.source === "personal" ? "skill-personal" : "skill-pro";
      html += `<span class="skill-badge ${cls}">${esc(skill.name)}</span>`;
    }
    html += "</div>";
  }
  return html;
}

function renderTimelineEntry(e: CareerEntry): string {
  const yearEnd = e.year_end === "present" ? "Present" : String(e.year_end);
  const yearStart = String(Number(e.year_start) || "");
  return `<div class="tl-entry">
    <div class="tl-dot-col">
      <div class="tl-dot"></div>
      <div class="tl-line"></div>
    </div>
    <div style="padding-bottom:8px; flex:1;">
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
        <div>
          <h3>${esc(e.role)}</h3>
          <div style="color:var(--muted); font-size:.9rem;">${esc(e.organization)}</div>
        </div>
        <div class="tl-year">${esc(yearStart)} – ${esc(yearEnd)}</div>
      </div>
      ${e.highlight ? `<p style="margin-top:6px; font-size:.92rem;">${esc(e.highlight)}</p>` : ""}
    </div>
  </div>`;
}

function renderBeyond(n: NonProfessionalEntry): string {
  return `<div class="card beyond-card">
    <h3>${esc(n.activity)}</h3>
    ${n.note ? `<p style="margin-top:4px; font-size:.9rem; color:var(--muted);">${esc(n.note)}</p>` : ""}
  </div>`;
}
