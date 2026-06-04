import type { Skill } from "../types/persona";

/** HTML-escape a value for safe interpolation into rendered documents. */
export function esc(s: string | number | undefined | null): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Group skills by category in a stable display order, dropping empty groups. */
export function groupSkills(skills: Skill[]): Map<string, Skill[]> {
  const order = ["Technical", "Tool", "Domain", "Soft", "Transversal", "Language"];
  const map = new Map<string, Skill[]>();
  for (const cat of order) map.set(cat, []);
  for (const skill of skills) {
    const cat = skill.category ?? "Technical";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(skill);
  }
  for (const [k, v] of map) if (!v.length) map.delete(k);
  return map;
}
