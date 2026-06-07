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

### Phase 1 — remaining ✓
- [x] **Build verification** (deps installed, both packages build):
      `lab/lab-vue` → `npm run build` (vue-tsc ✓ + vite ✓; emits es+umd, **no style.css**).
      `lab/generator-app` → `npm run verify` (**F-1 WCAG-AA all pass; F-3 static flatten PASS**)
      and `npm run build` (vue-tsc ✓ + vite ✓).
- [x] **Bug — broken `@import`** (caught by build): `lab.tailwind.css` imported the renamed-away
      `enclosure.tokens.css` → fixed to `lab.tokens.css`.
- [x] **Bug — dead dev import** (caught by build): `lab-vue/src/dev/main.ts` imported the deleted
      `../style.css`. Added `src/dev/lab.dev.css` (loads the canonical modular sheets, Tailwind
      layer excluded) so the playground satisfies the `--nc-lab:750` guard. README/CLAUDE updated.
- [x] **Bug — F-3 regression** (caught by verify): `--nc-screw-*` tokens existed in
      `lab.tokens.css` but were missing from `derive.ts`, so the static flatten left
      `calc()`/`--nc-seed-` unresolved. Added all 6 screw rows (light+dark) → F-3 PASS.
- [x] **Bug — Tauri crate mismatch** (caught while renaming): `main.rs` called
      `generator_app_lib::run()` but the lib was `enclosure_generator_lib`. Aligned both to
      `lab_generator_lib`; renamed productName/identifier/title and the package to Lab.
- [x] **Cosmetic text refs**: generator-app code comments + UI copy (ShowcaseArchitecture/Chat,
      ExpandButton, index/example titles), `lab-vue` README + dev playground, `lab/CLAUDE.md`
      (rewrote the stale vendored-style.css section), `lab/PRODUCT.md`, `lab/DESIGN.md` heading,
      `brand/ETHOS.md` C8.1 + checklist, root `CLAUDE.md`/`AGENTS.md` ("enclosure CSS" → "Lab").
      Generic English uses of the word "enclosure" (machined enclosure, etc.) intentionally kept.

### Phase 1 — still deferred
- [ ] **On-surface contract**: contextual `--nc-ctl-*` vars so controls auto-adapt to
      `.nc-monitor` without `--variant`. Mechanism settled; needs a render pass to tune
      dark-control visuals. Not Mirror-blocking (interview dark side is readout-only).
- [ ] **Regenerate** a distributable flattened `lab.css` artifact if/when an external consumer
      needs one. (Mirror currently vendors its own copy — addressed in Phase 4.)
- [ ] **Root `CLAUDE.md` data-philosophy line** still says "never sold, never trains anything"
      (pre-reconciliation absolutism); BRAND.md/ETHOS.md now say "integrity, not absolutism".
      Out of Phase-1 CSS scope — fold into a docs pass.

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
