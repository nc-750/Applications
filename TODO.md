# TODO — Lab design system rollout

Tracks the work remaining after the documentation pass. The brand + visual docs now
match intent (committed in `fe83c91`). This file is the bridge from *documented* to
*implemented*.

**Reference docs (source of truth):**
- `brand/VISUAL_IDENTITY.md` — the constitution (three grammars, principles, anti-refs).
- `lab/DESIGN.md` — tokens + component catalogue (design.md format, lint-clean).
- `lab/DESIGN_USE.md` — application rules (layout, responsive, motion, interaction).
- `brand/exploration/*.html` — interactive references. **Do not delete.** Use to validate
  the CSS rework and the production demos.

---

## Phase 0 — Done ✓
- [x] VISUAL_IDENTITY.md (constitution)
- [x] DESIGN_USE.md (application guide)
- [x] BRAND.md reframe (visual section → pointer; "structural, not chromatic")
- [x] ETHOS.md Section 1 reconcile (integrity-not-absolutism; C1.6 fallback tier)
- [x] DESIGN.md extend + rename to Lab + flatten colors (design.md lint: 0 errors)
- [x] Commit docs + keep exploration references

---

## Phase 1 — CSS rework  ⚠️ ANALYSIS FIRST
> Do **not** start coding yet. A deeper analysis / brainstorm precedes this; the approach
> may change radically now that the documentation matches intent. Treat the items below as
> the *targets* the rework must hit, not a prescribed implementation.

Pre-work:
- [ ] Audit the current CSS in `lab/generator-app/css/` (17 files) against
      `DESIGN_USE.md` — list every place the implementation drifted.
- [ ] Decide the rework strategy (incremental correction vs. clean rebuild of the
      seam/elevation/surface layers). Capture the decision before touching code.

Targets (from `DESIGN_USE.md` §14 migration note + the constitution):
- [ ] **Seams, not shadows** — remove shadowed/floating seams; restore flat 1px seams +
      bevel-only depth (Rules S1, S2).
- [ ] **Light-first** — default is the bright machined field; dark is the cavity/night
      theme, not the default presentation.
- [ ] **Dense + open rhythm** — introduce the recessed **drafting plate** surface for
      diagrams/readouts (Section 6 / SF1–SF3). It maps to `--nc-inset` + `--nc-edge-inset`.
- [ ] Keep the seed engine intact; keep WCAG auto-adjust (`generator-app/src/generator/wcag.ts`).
- [ ] Keep the `--nc-*` token prefix (rename is name-only; do not churn the token API).

## Phase 2 — New components (CSS + Vue)
Build the Diagram & Schematic and Instrument components now catalogued in `DESIGN.md` §5.
- [ ] CSS: `.nc-plate`, `.nc-schematic-box`, `.nc-path`, `.nc-null`, `.nc-sever`,
      `.nc-leader`, `.nc-exploded`, `.nc-glyph`.
- [ ] CSS: `.nc-facet`, `.nc-readout-live`, `.nc-coverage`, `.nc-acquire`, `.nc-log`.
- [ ] Vue facades in `lab/lab-vue/` (class-string facade convention — no
      `<style>`, no color/spacing props).
- [ ] Re-sync the vendored `lab-vue/src/style.css` from the generated CSS.
- [ ] Decide how `.nc-exploded` is authored (hand-built SVG per subject — likely a doc'd
      pattern, not a component).

## Phase 3 — Production reference examples
Replace the exploration sketches with shipped-quality examples (per VISUAL_IDENTITY note).
- [ ] Component showcase (every token + component in the Lab language).
- [ ] Desktop application mock(s).
- [ ] Mobile application mock(s).
- [ ] These become the canonical visual tie-breaker referenced by the docs.

## Phase 4 — Apply to products
- [ ] Mirror (`mirror/persona-app`): rebuild the interview as the **instrument** model
      (probe / live readout / saturation / acquisition / collapsing log), per
      `DESIGN_USE.md` §10. Mobile per §9.
- [ ] Re-check each NODE/UNIT/CORE surface against the three grammars.

---

## Decisions pending
- [ ] **`missing-primary` lint warning** — leave the descriptive palette as-is (advisory
      only), or add a `primary` alias token to silence it?
- [ ] **Folder / package rename** — system is "Lab" but the directory is `lab/` and
      the package is `lab-vue`. Rename to match (cosmetic, touches root `CLAUDE.md`,
      `lab/CLAUDE.md`, tooling), or leave the paths and only rebrand the name? Token
      prefix `--nc-` stays regardless.
- [ ] **Light ghost-button contrast** — known linter false positive (transparent bg over
      the field). Leave, or annotate.

## Constraints (do-not)
- Do **not** delete `brand/exploration/*.html` — they are validation references.
- Do **not** rename the `--nc-*` token prefix or churn the component API.
- Do **not** edit `brand/ETHOS.md` further without an explicit philosophy decision.
- Keep `lab/DESIGN.md` spec-conforming (run `npx --package "@google/design.md"
  designmd lint DESIGN.md` after edits; target 0 errors).
