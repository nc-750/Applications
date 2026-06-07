# Phase 2 — CSS audit, consolidation & vocabulary cleanup

Shared source of truth for the two parallel implementation agents (CSS and lab-vue).
Decisions here are **binding**; if reality contradicts the plan, stop and flag it.

Reference: `brand/VISUAL_IDENTITY.md` (3 grammars + 9 principles, §4 must-nevers),
`lab/DESIGN_USE.md` (application rules), `lab/DESIGN.md` (token + component catalogue).

Guiding goal (from the owner): **the simplest CSS possible — easy to read, maintain,
extend — and a Lab UI kit that is NOT bloated.** When in doubt, remove rather than keep;
prefer composing app-local pieces in the consuming app over adding niche kit components.

---

## 0. Decisions taken (do not relitigate)

1. **Chat sheet → removed entirely.** The bubble transcript is a §4 must-never and the
   Mirror interview will be an *instrument*, not a chat. Whatever the interview needs will
   be decided when we build Mirror — and may live in the Mirror app, not in Lab.
2. **All synth-era flourishes → removed.** terminal (+ traffic-light dots, amber/green),
   scanlines, knob, fader, switch, meters (ADSR bars), dot-matrix, lcd--green,
   readout--vertical.
3. **Consolidate the duplicated recipes now** (silkscreen label, inline code, display
   numerals).
4. **Minimal additions only.** Two genuinely Lab-level, generic primitives: `nc-null`
   (the `0x00` mark) and `nc-cell-head` (cell-header anatomy). All interview/instrument
   components are **deferred** to the Mirror phase (see §5).

---

## 1. Component inventory (audit result)

Legend: **KEEP** · **CONSOLIDATE** · **REMOVE** · **ADD**

### Chassis / layout (`lab.layout.css`, `lab.surfaces.css`)
- KEEP: `nc-lab`, `nc-chassis`, `nc-band`, `nc-cell` (+`--grow-2/3`, `--fixed`, `--2`,
  `--accent`, `--brushed`, `--noisy`), `nc-plate`, `nc-screw` (+ corners).
- REMOVE: `nc-panel` (+`--raised/--inset/--interactive`). The **cell is the primary surface**
  (freeform canvas, optionally a recessed `nc-plate`); a free-floating raised card is not
  needed and risks reading as elevation (P3/P4). A future `nc-faceplate` may formalise the
  cell header/face, but is **not** in scope now.
- STRUCTURE: once `nc-panel` is gone, `lab.surfaces.css` holds only `nc-screw`. Move
  `nc-screw` (+ corner modifiers) into `lab.layout.css` (it decorates the chassis) and
  **delete `lab.surfaces.css`** — fewer files, simpler. Update the three reference points
  (`lab.css` `@import`, `flatten.ts` `surfacesRaw`, `lab.dev.css` `@import`).
> The `--nc-panel` / `--nc-panel-2/3` *color tokens* stay (used by `nc-cell`, `nc-segment`,
> tables, etc.). Only the `.nc-panel` *class* is removed.

### Typography (`lab.typography.css`)
- KEEP: `nc-heading-1..4`, `nc-display`, `nc-text-display/body/mono`, `nc-text-xl..2xs`,
  `nc-font-*`, `nc-text-secondary/muted/--accent`, `nc-label(--accent)`, `nc-caption(--accent)`,
  `nc-kbd`.
- CONSOLIDATE: `nc-label` becomes the canonical **silkscreen-label** core (see §3.1);
  `nc-code` becomes the canonical **inline-code** core (see §3.2); `nc-display`/`nc-readout`
  share a **display-numeral** core (see §3.3). `nc-partno` keep but see §3.1 (mono-meta core).

### Controls (`lab.controls.css`)
- KEEP: `nc-toggle`, `nc-segment`.
- REMOVE: `nc-switch` (+`__lever`, `.is-on`), `nc-knob`, `nc-fader`.

### Inputs (`lab.inputs.css`) — all KEEP
`nc-input`/`nc-textarea`/`nc-select` (+ sizes), `nc-checkbox`, `nc-radio`, `nc-field`
(`__label`, `__help`).

### Data display (`lab.datadisplay.css`)
- KEEP: `nc-readout` (+`--accent`), `nc-spec`/`nc-spec__label`/`nc-spec__value`,
  `nc-spec-strip`, `nc-led` (+`--on/--rec/--warn/--err`), `nc-badge` (+ variants), `nc-pill`,
  `nc-table` (+`-wrapper`, `--stacked`), `nc-progress` (+ variants).
- REMOVE: `nc-meters` (+ `i`, `.is-accent`, the `.nc-monitor` overrides), `nc-matrix`
  (+ `i`, media queries), `nc-readout--vertical`.

### Console / monitor (`lab.console.css`)
- KEEP: `nc-monitor`, `nc-lcd`, `nc-lcd--lg`, `nc-lcd-sub`.
- REMOVE: `nc-monitor--scan`, `nc-lcd--green`, `nc-terminal` (+ `__bar`, `__dots`, `__dot*`,
  `__title`, `__body`, `--amber`, `--green`). **Whole terminal block goes.**
- Rename the file's section comment from "CONSOLE / LCD" to "MONITOR / LCD".

### Feedback / navigation / decoration
- KEEP: `nc-alert` (+ variants, `__badge`); `nc-tabs`/`nc-tab`, `nc-breadcrumbs`;
  `nc-divider(--subtle)`, `nc-schematic`, `nc-dimension`, `nc-reg`, `nc-hatch(+variants)`,
  `nc-barcode`, `nc-tooltip`.
- REMOVE: `nc-avatar` (+ `img`, `--sm`, `--lg`) — only ever used by chat; will not be used.

### Prose (`lab.markdown.css`) — KEEP
`nc-prose`. Becomes the single prose system (the chat `nc-message__body` prose is removed
with chat — no merge needed).

### Chat (`lab.chat.css`) — REMOVE THE ENTIRE FILE
`nc-transcript`, `nc-message` (+ `--user/--assistant/--system/--error`, `__header/__name/
__time/__body/__actions`), `nc-composer` (+ `__input/__actions/__send`), `nc-typing`
(+ `__dot/__label`, `@keyframes nc-typing-pulse`), `nc-thinking` (+ `__header/__label/
__toggle/__body`, `--open`).

---

## 2. Removal list (exact)

### CSS (Agent A)
- **Delete file** `css/lab.chat.css`.
- Remove `@import "lab.chat.css";` from `css/lab.css`.
- In `src/generator/flatten.ts`: remove `chatRaw` import and its entry in `COMPONENT_CHUNKS`.
- In `lab-vue/src/dev/lab.dev.css`: remove the `lab.chat.css` `@import` line.
- `css/lab.controls.css`: delete `nc-switch*`, `nc-knob*`, `nc-fader*`.
- `css/lab.datadisplay.css`: delete `nc-meters*`, `nc-matrix*` (incl. their `@media`),
  `nc-readout--vertical`.
- `css/lab.console.css`: delete `nc-monitor--scan`, `nc-lcd--green`, all `nc-terminal*`.
- `css/lab.decoration.css`: delete `nc-avatar*` (`.nc-avatar`, `.nc-avatar img`, `--sm`, `--lg`).
- `css/lab.surfaces.css`: delete `nc-panel*`. Then move `nc-screw*` into `css/lab.layout.css`
  and **delete `css/lab.surfaces.css`**; remove its `@import` from `lab.css`, its
  `surfacesRaw` import + `COMPONENT_CHUNKS` entry from `flatten.ts`, and its `@import` from
  `lab-vue/src/dev/lab.dev.css`.

### generator-app showcase (Agent A — host app for the CSS)
- Delete `src/components/ShowcaseChat.vue`; remove its import + its `<div class="nc-cell">`
  wrapper in `src/Main.vue`.
- `src/components/ShowcaseControls.vue`: remove knob/fader/switch demos (keep toggle + segment).
- `src/components/ShowcaseDisplays.vue`: remove meters / dot-matrix / terminal demos.
- `src/components/ShowcaseArchitecture.vue`: replace the `nc-terminal` export-tree (8 refs)
  with an `nc-monitor` block wrapping a `<pre>` (monitor surface + mono text), or an
  `nc-plate`. No traffic-light dots.
- `src/components/HeaderDemo.vue`: remove the decorative `nc-knob` (line ~30).
- `src/components/SectionWrapper.vue` (line ~21): wraps **every** showcase section in
  `nc-panel nc-panel--inset` → replace with `nc-plate` (the recessed drafting plate is the
  direct successor to the inset panel).
- `src/components/ShowcaseStatus.vue` (line ~67): `nc-panel nc-panel--raised` → replace with
  a plain `nc-cell` interior block (or `nc-plate`). Keep the `--nc-panel` token labels in
  `ShowcaseColor.vue` (those reference the color token, not the class).
- After edits, grep the whole `generator-app/src` for any removed class and fix stragglers.

### lab-vue (Agent B)
- **Delete components**: `Transcript.vue`, `Message.vue`, `MessageHeader.vue`,
  `MessageBody.vue`, `MessageActions.vue`, `Composer.vue`, `TypingIndicator.vue`,
  `ThinkingBlock.vue` (chat); `Switch.vue`, `Knob.vue`, `Fader.vue` (synth); `Panel.vue`.
- Remove their `export` lines from `src/index.ts` (the "Chat" and "Behavioral" sections,
  plus the `Panel` export in "Primitives").
- `src/dev/App.vue`: remove the chat transcript demo and the knob/fader/switch demos and
  any now-unused imports.
- Let `components.d.ts` regenerate (or hand-trim) so it has no dangling refs.

---

## 3. Consolidation (Agent A)

The goal is **one definition per recipe**, reused via grouped selectors (no Tailwind/@apply
in Lab CSS, so use multi-selector rules; cross-file grouping is fine — `typography.css` is
imported before component sheets, so component-file deltas win on equal specificity).

### 3.1 Silkscreen-label core
There are two related micro-label families. Define each **once** in `typography.css`:

**Label core** (`track-label`, `text-2xs`, uppercase, mono, medium) — used by:
`.nc-label`, `.nc-spec__label`, `.nc-field__label`, `.nc-alert::before`, `.nc-lcd-sub`,
`.nc-badge`, `.nc-table th`.
```css
.nc-label, .nc-spec__label, .nc-field__label, .nc-alert::before,
.nc-lcd-sub, .nc-badge, .nc-table th {
  font-family: var(--nc-font-mono);
  font-size: var(--nc-text-2xs);
  font-weight: var(--nc-font-medium);
  letter-spacing: var(--nc-track-label);
  text-transform: uppercase;
}
```
Each member then keeps **only its deltas** in its own file: colour (`ink-3` default;
`nc-lcd-sub`→`ink-invert-2`; `nc-badge`→`ink-2`), and box/layout props
(`nc-badge` height/padding/bg/border/radius; `nc-table th` text-align/padding/border;
`nc-alert::before` line-height/padding-top). Remove the duplicated font/size/tracking lines
from those members.

**Mono-meta core** (`track-mono`, mono) — used by the interactive/inline meta labels:
`.nc-partno`, `.nc-tab`, `.nc-segment button`, `.nc-breadcrumbs`. These differ from the
label core (no forced uppercase on partno/breadcrumbs; `text-xs` on tab/segment). Define a
second small shared rule for the shared bits (`font-family`, `letter-spacing: track-mono`)
and keep per-member size/case/colour. Do **not** force these into the label core.

### 3.2 Inline-code core
`.nc-code` and `.nc-prose code` are identical. Group:
```css
.nc-code, .nc-prose code {
  font-family: var(--nc-font-mono);
  font-size: var(--nc-text-xs);
  background: var(--nc-inset);
  color: var(--nc-accent-ink);
  padding: 1px 6px;
  border-radius: var(--nc-radius-sm);
  box-shadow: var(--nc-edge-inset);
}
```
Keep this in `typography.css`; delete the duplicate from `markdown.css`.

### 3.3 Display-numeral core
`.nc-display` and `.nc-readout` share font-display/`text-5xl`/bold/`track-display`/
`leading-none`. Group the base in `typography.css`:
```css
.nc-display, .nc-readout {
  font-family: var(--nc-font-display);
  font-size: var(--nc-text-5xl);
  font-weight: var(--nc-font-bold);
  line-height: var(--nc-leading-none);
  letter-spacing: var(--nc-track-display);
  color: var(--nc-ink);
}
```
`nc-readout` then adds only `font-variant-numeric: tabular-nums`; `nc-readout--accent` only
the colour. (`nc-readout` lives in `datadisplay.css` — keep its deltas there.)

> After consolidation, re-run `npm run verify` — the derive/WCAG pipeline is unaffected, but
> confirm F-1/F-3 still pass and the generator-app build is clean.

---

## 4. Additions (minimal, Lab-level)

### 4.1 `nc-null` — the `0x00` null mark  (`lab.decoration.css`, Document grammar)
Load-bearing brand vocabulary: certifies a zero/none/null state. A small mono stamp.
```css
.nc-null {
  display: inline-flex;
  align-items: center;
  font-family: var(--nc-font-mono);
  font-size: var(--nc-text-2xs);
  font-weight: var(--nc-font-medium);
  letter-spacing: var(--nc-track-mono);
  color: var(--nc-accent);
  /* default content is the literal "0x00" in markup; the class only styles it */
}
```
Markup convention: `<span class="nc-null">0x00</span>`. The accent here is the one
sanctioned signal use for null (P8).

### 4.2 `nc-cell-head` — cell-header anatomy  (`lab.layout.css`, Chassis grammar)
Implements the glossary's "title left / spec-detail right" cell header (DESIGN_USE cell
anatomy), used to give every cell a consistent header without re-inventing flex each time.
```css
.nc-cell-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--nc-space-3);
  margin-bottom: var(--nc-space-4);
}
.nc-cell-head__title { /* a heading; author picks nc-heading-* / nc-label in markup */ }
.nc-cell-head__spec  { /* right-aligned mono spec-detail — joins the mono-meta core */
  font-family: var(--nc-font-mono);
  letter-spacing: var(--nc-track-mono);
  color: var(--nc-ink-3);
  white-space: nowrap;
}
```

---

## 5. Deferred — decide during the Mirror refactor (do NOT add now)

These instrument/interview components were identified as *eventually* needed but are
explicitly **out of scope** for Phase 2 to avoid bloating the kit. When we build Mirror we
decide, per item, whether it belongs in Lab or is composed app-locally in Mirror:
`nc-probe`, `nc-acquire` (working/"reading signal" state), `nc-readout-live`, `nc-coverage`
(unbounded-interview meter), `nc-dropzone` (CV/LinkedIn intake), `nc-facet`,
`nc-schematic-box`/`nc-path`/`nc-sever` (data-flow privacy diagram), `nc-glyph`.

---

## 6. Two-agent work split & coordination

**Hard file-ownership boundary (no overlap):**
- **Agent A — CSS + generator-app host.** Owns everything under `lab/generator-app/**`
  *plus* `lab/lab-vue/src/dev/lab.dev.css` (it tracks the CSS sheet list). Does all of §2
  (CSS + showcase), §3, §4.
- **Agent B — lab-vue facades.** Owns `lab/lab-vue/src/**` *except* `dev/lab.dev.css`. Does
  the lab-vue removals in §2, and adds two facades: `Null.vue` (→ `nc-null`) and
  `CellHead.vue` (→ `nc-cell-head`/`__title`/`__spec`), exported from `index.ts`. Per the
  kit convention: class-string facade, no `<style>`, no CSS.

**Coordination contract.** Agent B may reference the new classes (`nc-null`, `nc-cell-head*`)
before Agent A writes them — that is expected and fine. The authoritative class catalogue is
this document (§1 KEEP set minus §2 REMOVE set plus §4 ADD set). Neither agent invents class
names outside this catalogue.

**Verification (each agent, before reporting done):**
- Agent A: `cd lab/generator-app && npm run verify` (F-1 + F-3 PASS) and `npm run build`
  (vue-tsc + vite clean). Grep `generator-app/src` + `css` for every removed class
  (`nc-panel`, `nc-avatar`, `nc-terminal`, `nc-monitor--scan`, `nc-lcd--green`, `nc-knob`,
  `nc-fader`, `nc-switch`, `nc-meters`, `nc-matrix`, `nc-readout--vertical`, all `nc-message*`/
  `nc-transcript`/`nc-composer`/`nc-typing`/`nc-thinking`) → **zero hits** (note: `--nc-panel`
  *token* refs are allowed; only the `.nc-panel` *class* must be gone).
- Agent B: `cd lab/lab-vue && npm run build` (vue-tsc + vite clean, no dangling imports/exports).
- Docs (Agent A, after CSS settles): update `lab/DESIGN.md` catalogue (drop Panel §, terminal,
  synth controls, avatar, chat; add `nc-null`/`nc-cell-head`) + `lab/DESIGN_USE.md` (drop
  `.nc-panel` refs at lines ~88/~121); keep `designmd lint` at 0 errors.

---

## 7. Out of scope for Phase 2
- Mirror migration (Phase 4) and the deferred instrument components (§5).
- On-surface `--nc-ctl-*` contract (still deferred from Phase 1).
- Any token (`lab.tokens.css`/`lab.seeds.css`) changes — Phase 2 touches components only.
