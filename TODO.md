# TODO — Lab design system rollout

Tracks the work after the documentation pass. Reference docs (source of truth):
`brand/VISUAL_IDENTITY.md` (constitution), `lab/DESIGN.md` (tokens + components,
design.md format, lint-clean), `lab/DESIGN_USE.md` (application rules),
`brand/exploration/*.html` (interactive references — **do not delete**).

---

## Phase 0 — Docs ✓ (commit fe83c91)
- [x] VISUAL_IDENTITY.md, DESIGN_USE.md, BRAND reframe, ETHOS reconcile, DESIGN extend (lint 0 errors).

## Phase 1 — CSS rework + Lab rename ✓ (commits 6e2a9de … 99621a3)
- [x] Flat 1px seams; grooved look removed; chassis framed (radius + overflow). `6e2a9de`
- [x] Flexbox layout + Lab class vocabulary: `nc-lab` (root) > `nc-chassis` (flex col) >
      `nc-band` (flex row) > `nc-cell`; `nc-monitor` (one dark surface); `nc-plate`
      (drafting plate). Removed grid `--cols`, `nc-shell`/`nc-page`/`nc-cell--dark`. `00d0d56`
- [x] `--nc-lab: 750` sentinel. `d2ae0e1`
- [x] CSS files renamed `enclosure.*.css` → `lab.*.css` (+ aggregate `lab.css`, flatten.ts,
      main.ts, example.html). `5b9de9d` / `038571a`
- [x] lab-vue: package renamed, CSS decoupled (no vendored style.css, no copy plugin,
      no style.css export), **fail-loud guard** (`src/guard.ts` probes `--nc-lab:750`,
      console + full-screen banner + throw; auto-runs + optional `Lab` plugin). `63ce9d5`
- [x] Docs class renames (Module→Chassis, Grid→Band, Console→Monitor). `0c45eee`
- [x] Folder rename `enclosure/`→`lab/`, `enclosure-vue/`→`lab-vue/` (git mv, history kept). `03c13d9`
- [x] Path references `enclosure/`→`lab/` in monorepo + brand docs; name in CLAUDE files. `99621a3`
- [x] `lab/DESIGN.md` design.md lint: **0 errors** (24 benign warnings).

### Phase 1 — remaining (not yet done)
- [x] **Build verification**: `lab/lab-vue npm run build` ✔, `lab/generator-app npm run verify` ✔,
      `lab/generator-app npm run build` ✔ (validated during Phase 2).
- [x] **On-surface contract**: contextual `--nc-ctl-*` vars so controls auto-adapt
      to `.nc-monitor` without `--variant`. Mechanism settled; needs a render pass to tune
      dark-control visuals. Not Mirror-blocking (interview dark side is readout-only).
- [ ] **Cosmetic text refs** still saying "enclosure"/"Enclosure": `lab/generator-app` code
      comments (derive.ts/useTheme.ts/flatten.ts) + UI copy (Header.vue), `lab/lab-vue/README.md`,
      `lab/PRODUCT.md`, `lab/generator-app/index.html` title.
- [ ] **Generator-app Tauri identifiers** (`src-tauri/Cargo.toml`, `tauri.conf.json`) still
      use `enclosure` — renaming the Rust crate/bundle id is a separate, riskier change.
- [ ] **Regenerate** a distributable flattened `lab.css` artifact if consumers need one.

## Phase 2 — CSS audit, consolidation & vocabulary cleanup ✓

Per `lab/PHASE2_PLAN.md`. Guiding goal: simplest CSS possible — easy to read, maintain,
extend — and a Lab UI kit that is NOT bloated.

- [x] **Chat sheet removed** (`lab.chat.css` deleted; chat components purged from lab-vue).
- [x] **Synth-era flourishes removed**: terminal (+ traffic-light dots, amber/green), scanlines,
      knob, fader, switch, meters (ADSR bars), dot-matrix, `lcd--green`, `readout--vertical`.
- [x] **Duplicated recipes consolidated**: silkscreen-label core, mono-meta core, display-numeral
      core, inline-code core — one definition each, shared via grouped selectors.
- [x] **`nc-panel` class removed**; `--nc-panel` color token stays (used by `nc-cell`, etc.).
      `lab.surfaces.css` deleted; `nc-screw` moved into `lab.layout.css`.
- [x] **Additions**: `nc-null` (0x00 null mark), `nc-cell-head` (cell-header anatomy) + lab-vue
      facades (`Null.vue`, `CellHead.vue`).
- [x] **lab-vue removals**: Transcript, Message*, Composer, TypingIndicator, ThinkingBlock (chat);
      Switch, Knob, Fader (synth); Panel. Exports cleaned in `index.ts`.
- [x] **Generator-app showcase**: ShowcaseChat deleted; knob/fader/switch/meters/matrix/terminal
      demos removed; `nc-terminal`→`nc-monitor`+`<pre>` in Architecture; `nc-panel`→`nc-plate`
      in SectionWrapper.
- [x] **Docs updated**: `DESIGN.md` (removed terminal/synth/avatar/chat refs), `DESIGN_USE.md`
      (`.nc-panel`→`.nc-cell`).
- [x] **All verifications pass**: WCAG-AA (F-1), static flatten (F-3), generator-app build
      (vue-tsc + vite), lab-vue build (vue-tsc + vite). Zero straggler class hits.

### Deferred from Phase 2 → Mirror phase
Instrument/interview components explicitly out of scope: `nc-probe`, `nc-acquire`,
`nc-readout-live`, `nc-coverage`, `nc-dropzone`, `nc-facet`, `nc-schematic-box`/`nc-path`/
`nc-sever`, `nc-glyph`. Decide per item during Mirror refactor whether it belongs in Lab
or is composed app-locally.

## Phase 3 — New diagram/instrument CSS + lab-vue facades ✓
- [x] Diagram/instrument CSS: `.nc-schematic-box`, `.nc-path`, `.nc-sever`, `.nc-leader`,
      `.nc-exploded`, `.nc-glyph`, `.nc-facet`, `.nc-coverage`,
      `.nc-acquire`, `.nc-log` (see DESIGN.md §5).
- [x] lab-vue facades for the above (class-string facade convention).
- [x] **Remove `.nc-readout`** — the existing class is redundant with `.nc-display` (they
      share the display-numeral core consolidated in Phase 2). The constitution reserves
      "Readout" for the live instrument surface (DESIGN_USE §6), which is an application
      composition, not a CSS class. Replace `.nc-readout` usages in generator-app showcase
      with `.nc-display`; delete the class from `lab.typography.css` and
      `lab.datadisplay.css`. Also remove `.nc-readout-live` from all design docs — it was
      a planned class for Phase 3 that is now recognised as a composition pattern, not a
      standalone component.

## Phase 4 — Production reference examples ✓
- [x] Generator-app restructured to proper Lab grammar (single `.nc-chassis`, bands, cells)
- [x] Three views: Component Catalog, Inspect (task instrument), Brand (marketing)
- [x] Catalog view — existing showcase refactored into `nc-band` rows
- [x] Inspect view — interactive task inspector with project selector, coverage meters,
      dependency schematic, signal trace cavity, acquisition state, and session log
- [x] Brand view — NC-750 manifesto page using document grammar (hero, product family,
      principles table, anti-patterns, certification, CTA)
- [x] View switcher using `nc-segment`; single chassis, content swaps
- [x] Desktop/tablet/mobile responsive via existing `nc-band` media queries
- [x] All builds + verifications pass

### Option B (kept for reference)
Writing Analysis Instrument — "Scope". Paste prose → instrument measures readability,
tone, structure, and voice. Bands: Input cell (nc-textarea + facet tag), Readout cavity
(waveform, nc-lcd score, nc-led tone), Metrics table, Coverage meters (Clarity,
Conciseness, Structure, Voice), Session log. Interactive: paste → Analyze → nc-acquire
→ readout populates.

## Phase 5 — Apply to products
- [ ] **Mirror** (`mirror/app`): migrate from its vendored CSS to the Lab system;
      rebuild the interview as the instrument model (DESIGN_USE §10). Mirror's
      references were intentionally left untouched by the design-system rename.

## Constraints (do-not)
- Do not delete `brand/exploration/*.html`. Do not rename the `--nc-` token/class prefix.
- Keep `lab/DESIGN.md` design.md-conforming (run `designmd lint`; 0 errors).
- Maintain WCAG 2.1 AA (do not bypass `wcag.ts`).
