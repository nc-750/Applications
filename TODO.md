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
- [ ] **Build verification** (could NOT run here — `node_modules` not installed):
      `cd lab/lab-vue && npm install && npm run build` (vue-tsc + vite — validates guard.ts),
      and `cd lab/generator-app && npm install && npm run verify` (WCAG-AA + static output).
- [ ] **On-surface contract** (deferred): contextual `--nc-ctl-*` vars so controls auto-adapt
      to `.nc-monitor` without `--variant`. Mechanism settled; needs a render pass to tune
      dark-control visuals. Not Mirror-blocking (interview dark side is readout-only).
- [ ] **Cosmetic text refs** still saying "enclosure"/"Enclosure": `lab/generator-app` code
      comments (derive.ts/useTheme.ts/flatten.ts mention `enclosure.tokens.css` etc.) + UI
      copy (Header.vue, ShowcaseArchitecture/Chat), `lab/lab-vue/README.md`, `lab/PRODUCT.md`,
      `lab/generator-app/index.html` title.
- [ ] **Generator-app Tauri identifiers** (`src-tauri/Cargo.toml`, `tauri.conf.json`) still
      use `enclosure` — renaming the Rust crate/bundle id is a separate, riskier change.
- [ ] **Regenerate** a distributable flattened `lab.css` artifact if consumers need one.

## Phase 2 — New components (CSS + lab-vue)
- [ ] Diagram/instrument CSS: `.nc-plate` exists; add `.nc-schematic-box`, `.nc-path`,
      `.nc-null`, `.nc-sever`, `.nc-leader`, `.nc-exploded`, `.nc-glyph`, `.nc-facet`,
      `.nc-readout-live`, `.nc-coverage`, `.nc-acquire`, `.nc-log` (see DESIGN.md §5).
- [ ] lab-vue facades for the above (class-string facade convention).

## Phase 3 — Production reference examples
- [ ] Component showcase + desktop + mobile app mocks (shipped-quality) → become the
      canonical visual tie-breaker referenced by the docs.

## Phase 4 — Apply to products
- [ ] **Mirror** (`mirror/app`): migrate from its vendored `enclosure.css` to the Lab
      system; rebuild the interview as the instrument model (DESIGN_USE §10). Mirror's
      references were intentionally left untouched by the design-system rename.

## Constraints (do-not)
- Do not delete `brand/exploration/*.html`. Do not rename the `--nc-` token/class prefix.
- Keep `lab/DESIGN.md` design.md-conforming (run `designmd lint`; 0 errors).
- Maintain WCAG 2.1 AA (do not bypass `wcag.ts`).
