# Target: web — the Lab contract (`@nc-750/lab-vue` + `.nc-*`)

The concrete web implementation of the instrument philosophy in `SKILL.md`. This is the binding
contract for an NC-750 Vue / web surface. It encodes **CONVENTIONS §7.2–7.7**, the `.nc-*` class
vocabulary, the `@nc-750/lab-vue` component surface, and the styling-placement rule.

> **Scope split with `nc-750-web-frontend-architecture`.** §7.1 (*one job → one component*) and §7.8–7.19
> (duplication, extraction, dead code, `console.log`, error handling per layer) are the
> *code-structure* doctrine and are owned by **`nc-750-web-frontend-architecture`** — apply them from there.
> This module owns the **visual contract**: the Chassis/Band/Cell hierarchy, not restyling structure,
> the Tailwind-in-Cell rule, `.nc-*` for visuals, the MonitorCell meaning, and naming a component
> after its Lab root. The only structural rule restated here is §7.1's *visual* consequence (two
> implementations of one screen = two visual languages), because it bears on conformance.

## How the system is wired

- The Lab ships as a stylesheet of **`.nc-*` classes** (no per-component CSS) plus a typed Vue facade
  package, **`@nc-750/lab-vue`**, whose components emit those class strings and ship **no CSS** of
  their own. The stylesheet is imported once at the app root; the `Lab` plugin (`app.use(Lab)`) runs
  a fail-loud guard that the stylesheet is actually loaded.
- **Every visual decision flows through CSS custom properties** (the seed/token system). Components
  reference tokens, never hardcoded hex/HSL/spacing/font values. A component rule with a literal
  color is a bug. Dark theme is `data-theme="dark"` and only *redefines tokens* — never adds
  component overrides.
- You build screens by composing `@nc-750/lab-vue` components (and, where a component does not exist,
  the raw `.nc-*` classes they wrap).

## The binding rules (CONVENTIONS §7.2–7.7)

### 7.2 — Build UI only from the Lab hierarchy
One **Chassis** (`ChassisHeader` + `ChassisFooter`) → **`Band`s** → **`Cell`s / `MonitorCell`s**. **No
`Cell` outside a `Band`, no `Band` outside the Chassis.** The contract is deliberately opinionated so
every screen reads the same.

### 7.3 — Never restyle the structural elements
Do not use Tailwind or custom CSS to change the *inner layout* of `ChassisHeader`/`ChassisFooter`,
`Band`, `Cell`, or `MonitorCell`. **They own their own layout.** Restyled structure is how screens
drift apart and theming breaks. (Setting a `grow` ratio prop on a `Band`/`Cell` is configuring the
contract, not restyling it — that is fine.)

### 7.4 — Inside a `Cell`, do layout with Tailwind utilities only
On the **content root inside a Cell**, express layout with Tailwind utilities (`flex`, `gap-*`,
`justify-*`, `items-*`, `grid`, …) — **not** custom CSS, not a second layout approach. This is the
one small, auditable layout vocabulary allowed inside cells. (Tailwind v4 is present in the app only
for this app-level layout role — the Lab design-system CSS itself uses **no Tailwind**.)

### 7.5 — Style inner elements with `.nc-*` classes
Visuals come from the design system: `nc-btn`, `nc-text-*`, `nc-heading-*`, `nc-label`, `nc-input`,
`nc-badge`, `nc-led`, … Reach for custom/scoped CSS or extra Tailwind *visual* utilities **only when
`.nc-*` genuinely cannot express it — and say why in a one-line comment when you do.** Visuals belong
to the design system so theming stays centralised.

> **The styling-placement split, in one line:** *structure* → Lab components (don't restyle);
> *layout inside a cell* → Tailwind utilities; *visuals* → `.nc-*` classes; *anything else* → a
> commented, justified escape hatch.

### 7.6 — `MonitorCell` (or `nc-monitor`) is for live, read-only readouts only
Use it for live / mutating, read-only values — never for user input. **A monitor does not host
forms.** Dark cavity = alive/measuring; light cell = static/operable. If input is needed, it goes on
a `Cell`, not in the monitor.

### 7.7 — Name a feature component after its Lab root
A feature-specific component is named after the Lab element that is its **root**, suffixed `Band` /
`Cell` / `MonitorCell` (e.g. `NavigationBand`, `ProbeCell`, `ReadoutMonitorCell`). The suffix is a
**promise about the root tag** — keep it true; it tells a reader where the component may legally sit.
When a cohesive group of cells must move and live together for a feature to make sense, wrap them in
their own `*Band` rather than wiring the pieces inline at the page level.

### 7.1 (visual consequence only) — one screen, one implementation
If a screen has two implementations, two visual languages are in the tree. Promote the better one and
delete the other in the same change. (The general one-job-per-component / dead-code doctrine is
`nc-750-web-frontend-architecture`'s — this note is only its visual stake.)

### Style mechanic
Indentation is **4 spaces**, every file type (CONVENTIONS §7.15).

## The `@nc-750/lab-vue` component surface

The typed facade. Compose these; do not hand-roll their markup. Props shown are the meaningful ones.

### Layout (structure — never restyle; §7.3)
| Component | Root / class | Key props | Notes |
|---|---|---|---|
| `ChassisHeader` | `.nc-chassis-header` | `title`, `subtitle` | Dark status bar; `title` links home, `subtitle` is the LCD readout. |
| `ChassisFooter` | `.nc-chassis-footer` | — | Quiet dark nameplate. |
| `Band` | `.nc-band` | `grow?: 0\|1\|2\|3` | Flex row of cells; the 1px gap shows through as the seam. |
| `Cell` | `.nc-cell` | `title?`, `spec?`, `surface?: "2"\|"accent"\|"brushed"`, `variant?: "thin"`, `grow?: 0\|1\|2\|3` | Raised panel. `title`+`spec` render the cell header (function title left, spec-detail right). |
| `MonitorCell` | `.nc-cell.nc-monitor` | `title?`, `spec?`, `variant?`, `grow?` | The dark cavity. Read-only readouts only (§7.6). |
| `CellHead` | `.nc-cell-head` | slots: `title`, `spec` | Standalone cell header when you need finer control than `Cell`'s props. |

> The Chassis itself is the `.nc-chassis` container (vertical flex, ink-seam border, `xl` radius,
> `overflow: hidden`). One outer radius for the chassis; **inner cells are square against the seams** —
> a rounded cell inside a rounded chassis reads as a bubble (forbidden).

### Primitives & forms (visuals — §7.5)
`Button` (`variant: default|primary|accent|secondary|ghost|danger`, `size: sm|md|lg`, `icon`,
`submit`) · `Key` · `Label` · `Badge` · `Heading` (`level: 1|2|3|4`, `as?`) · `Text` · `Divider` ·
`Null` (the `0x00` mark) · `Input` · `Select` · `Textarea` · `Checkbox` · `Radio` · `Form` ·
`FormField` · `TextField` · `Field` (`label`, `help`, `for`) · `ButtonGroup` · `Segmented` ·
`ExpandButton`.

### Document / diagram (§ "document grammar" — communicate, don't decorate)
`SchematicBox` (a labelled real component) · `Path` (the one live data route, in signal colour) ·
`Sever` (a red ✕ proving a connection does *not* exist) · `Leader` (callout line to a margin label) ·
`Exploded` (hand-built set-piece) · `Glyph` (`symbol: node|relay|null|active|enclose|local|signal|
verify|registration`, `variant: default|active|verified|null`). **Diagram linework is neutral; signal
only on the live path and `0x00`. A schematic must depict real behaviour.**

### Instrument (the behaviour layer — guard it)
| Component | Class | Meaning |
|---|---|---|
| `Facet` | `.nc-facet` | A mono uppercase tag for *what the instrument is currently measuring* (`OBSERVATION · PATTERNS`). |
| `Coverage` | `.nc-coverage` | A **saturation** bar (`value` 0–100, `locked`), not a step counter — for open-ended processes of unknown length. Fills toward "locked". |
| `Acquire` | `.nc-acquire` | The **working** state: an animating waveform + `ANALYZING …` label. Foreground/blocking work only; background work uses a quiet ambient indicator instead. |
| `SessionLog` | `.nc-log` | Prior exchanges collapsed into terse, re-openable entries (`OBS 01 ▸ ANSWERED`) — a flight recorder, append-only, not a chat feed. Takes `entries: { id, marker, summary, body }[]`. |

> **A readout is not a component — it is a composition.** Assemble it inside a `MonitorCell` cavity
> from `Facet` + `Coverage` + `nc-lcd` typography + `nc-led` indicators, laid out with your own
> Tailwind (§7.4). The Lab gives you the surface and the parts; the layout of the readout is the
> application's job. Derive it from the instrument's *actual measurements* — do not copy a template.

### Useful raw `.nc-*` classes (no facade component)
`nc-lcd` / `nc-lcd-sub` (mono LCD type with the orange glow, for live values) · `nc-led` +
`--on|--rec|--warn|--err` (status dots) · `nc-spec` / `nc-spec-strip` (labelled value pairs) ·
`nc-plate` (the recessed **drafting plate** a diagram breathes on) · `nc-monitor` (the cavity, if you
need it outside `MonitorCell`) · `nc-progress` · `nc-table` · `nc-alert` (the one sanctioned 3px
left-stripe, a *functional* severity indicator) · `nc-tabs` · `nc-breadcrumbs` · `nc-schematic`
(labelled rule) · `nc-dimension` · `nc-hatch` · `nc-pill`.

## Before / after (illustrative — derive from your real screen)

### A view that orchestrates + styles itself by hand → composed from the Lab hierarchy
```vue
<!-- ❌ before — bare divs, hand-rolled layout, a shadow standing in for a seam, a marketing title -->
<template>
    <div class="card" style="box-shadow: 0 2px 8px rgba(0,0,0,.15); padding: 16px">
        <h2>Tell us about yourself</h2>
        <div class="chat">
            <div v-for="m in messages" :key="m.id" class="bubble">{{ m.text }}</div>
        </div>
        <input v-model="answer" />
    </div>
</template>
```
```vue
<!-- ✅ after — one chassis → band → cells; readout in a MonitorCell, input on an operable Cell;
     function titles + spec-detail; seams (no shadow); layout via Tailwind, visuals via .nc-* -->
<template>
    <Band>
        <MonitorCell title="READOUT" spec="INSTRUMENT // 0x00-IV" :grow="2">
            <!-- live, read-only reading — Facet + Coverage + nc-lcd, laid out with Tailwind -->
            <div class="flex flex-col gap-3">
                <Facet>OBSERVATION · PATTERNS</Facet>
                <Coverage :value="coverage" :locked="isSaturated" />
                <span class="nc-lcd">{{ confidence }}%</span>
            </div>
        </MonitorCell>
        <Cell title="PROBE" spec="RAIL // 0x01" :grow="1">
            <div class="flex flex-col gap-2">
                <Textarea v-model="answer" />
                <Button variant="accent" @click="onSubmitAnswer">SUBMIT</Button>
            </div>
        </Cell>
    </Band>
</template>
```

### Putting input in the readout → split across surfaces (§7.6)
```vue
<!-- ❌ before — a form inside the dark monitor cavity -->
<MonitorCell title="ANALYZER">
    <input v-model="answer" />          <!-- a monitor must not host input -->
    <Button @click="onSubmit">GO</Button>
</MonitorCell>
```
```vue
<!-- ✅ after — the monitor reads; the operable Cell takes the input -->
<MonitorCell title="ANALYZER" spec="LIVE // 0x00">
    <span class="nc-lcd">{{ reading }}</span>
</MonitorCell>
<Cell title="INPUT" spec="RAIL // 0x02">
    <div class="flex gap-2">
        <Input v-model="answer" />
        <Button variant="accent" @click="onSubmit">GO</Button>
    </div>
</Cell>
```

## Verify (web)

- The screen is **one Chassis → Bands → Cells/MonitorCells**; no `Cell` outside a `Band`, no `Band`
  outside the Chassis (§7.2). Structural elements are not restyled (§7.3).
- Layout inside any cell uses **Tailwind utilities only**; visuals use **`.nc-*`**; every escape to
  custom CSS carries a one-line *why* (§7.4–7.5).
- No `MonitorCell` / `nc-monitor` hosts input (§7.6). Cells have a function title + spec-detail, not a
  marketing title.
- Feature components are named after their Lab root with the right suffix (§7.7).
- No hardcoded colors/spacing/fonts in any component style — tokens only; works in `data-theme="dark"`
  without a component-level override.
- Every instrument reading (`Coverage`, `nc-progress`, confidence, lock) is a value the system truly
  computes; every diagram depicts real behaviour (honest-reading rule).
- 4-space indentation in touched files (§7.15).
- `bunx vue-tsc --noEmit` is clean — this is a `.vue` surface, and bare `tsc` silently skips SFCs
  (CONVENTIONS §8.2). (This stack uses **bun** — `bun run <script>`, `bunx <bin>`; never
  `npm` / `npx` / `node`.)
