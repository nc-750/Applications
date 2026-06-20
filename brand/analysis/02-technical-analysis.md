# 02 — Technical / Applicability Analysis (Agent 3)

> **Driving question Q2.** How can current UI concepts be transformed toward the NC-750
> worldview — a return to a more *utilitarian* use of a computer and its applications?
>
> **Altitude.** Strictly conceptual. This file analyses what *UI concepts themselves
> become* under the instrument / document / chassis worldview and the "honest state, no
> fake meters" rule. No frameworks, no code, no implementation vocabulary, no product
> instance is used as a worked example. The brand's *rules about instruments* are cited;
> no shipped product surface is.
>
> **Sources.** Grounded on `00-context-dossier.md`; verified against `BRAND.md`,
> `VISUAL_IDENTITY.md` (the constitution), `lab/DESIGN_USE.md` (the application guide),
> `ETHOS.md` (the compliance charter), and the inspiration read-out (dossier §B).

---

## 1. Analysis Log

**L1 — First framing (and the first thing I had to discard).**
My initial instinct was to read Q2 as "restyle current UI concepts in the Lab look" — a
skin pass. The constitution kills that reading in its own words: identity is *structural,
not chromatic* (`VISUAL_IDENTITY.md §3 P1`), and the migration note explicitly separates
"looks like the Lab" from "looks like a generic dark dashboard" (`DESIGN_USE.md §14`). So
a re-skin is the *failure* mode the documents are written to prevent, not the answer. I
re-cast Q2 as: *which UI concepts survive, which are constrained, which are replaced, and
which are rejected outright, when the worldview is taken seriously?*

**L2 — Extracting the three operative pressures.** Reading the constitution, three
distinct forces do the transforming, and they don't always point the same way:
- (a) **Instrument over app** (`P6`) — favour readouts, probes, signal, acquisition,
  one-directional input *over* chat bubbles, infinite feeds, generic form fields.
- (b) **Document over decoration** (`P5`) — every element must communicate something
  *true*; decoration that means nothing is forbidden.
- (c) **Honest state / no fake meters** (`DESIGN_USE.md §10`; `VI P9`; `ETHOS C5.5`) — a
  reading may only be shown when the system is genuinely taking that reading.
I initially treated (a) and (c) as one rule. They're not, and the gap between them is
where the most interesting transforms live (see L4).

**L3 — First revision: "instrument" is a *stance*, not a widget kit.** I started building
a one-to-one swap table (feed→readout, form→probe, spinner→acquisition). The guide
pre-empts this: §10 is titled "the essence, **not a template**," and `Rule I2` forbids
porting one product's probe/acquisition/saturation set onto a product whose task isn't a
sustained foreground inquiry. The dossier's own caution (`§D Q2 / DESIGN_USE I2`) repeats
it. So the correct output is not "concept X always becomes widget Y." It is "concept X is
subjected to a *test* — does it foreground the artifact? is its state honest? is its input
shaped to intent? — and it survives, mutates, or dies based on that test." I rewrote the
findings table around the *test*, not around fixed widget swaps.

**L4 — Second revision: honesty can *protect* a concept the instrument stance would
reject.** I assumed the two rules always agree. Counter-case: a multi-step configuration
with truly finite, known steps. The instrument-zeal reading says "replace the step counter
with saturation." The honesty rule says the *opposite* — `DESIGN_USE.md §10` ("Other
product shapes") states plainly: "do *not* fake 'saturation' where an honest 'step 3 of 5'
is the truth." So a conventional, much-maligned UI concept (the step indicator) is
*rehabilitated* by the honesty rule against the aesthetic rule. This flipped my read of
the whole system: NC-750 is not anti-progress-bar; it is **anti-*lying*-progress-bar**.
The progress bar is not rejected as a concept — it is conditioned on truth. That single
case reorganised my meta-answer (§2.4).

**L5 — Third revision: the "utilitarian" thesis is narrower than it sounds.** The *Making
Software* inspiration (dossier §B.7) frames the philosophical north star: "today we
understand them in a shallow, abstracted way," software as an exploded engineering
diagram, deep-tool-understanding over shallow abstracted use. I first read "utilitarian
computing" as *minimalism* — strip the UI down. But the document grammar is the opposite
of minimal: it *adds* part numbers, spec-details, registration marks, dimension lines,
data-flow schematics (`VISUAL_IDENTITY.md §2 Document`; dossier §B.8–B.11). The
utilitarianism here is not "fewer pixels"; it is "**no pixel that doesn't carry a true
load**." A spec-detail string on every cell (`Rule CE1`) is *more* chrome than a clean app
would show — justified because it makes the cell "an addressed component of a machine
rather than a generic box." So "utilitarian" = informational density in service of
comprehension, not ascetic reduction. This is a genuine tension with the usability
tradition that equates utilitarian with *minimal cognitive load* (logged as a weakness in
§2.5).

**L6 — Fourth revision: where the worldview goes silent.** Working concept-by-concept, I
found concepts the documents simply do not address — notably the **notification/badge**
and most of **navigation** — and concepts they address only by *negation* (the dashboard
is rejected in `VI §4` but its *replacement* is described only obliquely as "honest live
status"). I resolved not to invent doctrine for these; instead I flag them as the
worldview being silent or thin, and route the genuine forks to "Open questions" rather
than spinning (self-enforced circular-thinking rule). This is itself a finding: the
worldview is richly specified for *foreground inquiry* surfaces and *documentary* surfaces,
and comparatively under-specified for *ambient / asynchronous / wayfinding* surfaces.

**L7 — Balance check.** Before writing findings I forced a pro/con pass on each transform
(per the non-fixation rule): for every concept, what does the worldview genuinely improve,
and what real-world tension does it create (engineering cost, user expectation, edge cases
the metaphor can't carry). The findings table's last column is that tension, kept for every
row.

---

## 2. Findings

### 2.1 The transformation test (what actually does the work)

Before the per-concept table: every current UI concept is run through one test, derived
from `DESIGN_USE.md §10` + `VI P5/P6/P9`. A concept is **kept, constrained, replaced, or
rejected** according to four questions:

1. **Artifact or exchange?** Does it foreground the *thing being produced/measured*, or the
   log of interaction? (Foreground the artifact — `§10`.)
2. **Honest or invented state?** Does any reading it shows correspond to a measurement the
   system is genuinely taking? (No fake progress, no decorative meter — `§10`, `P9`,
   `ETHOS C5.5`.)
3. **Document or decoration?** Does each element carry a true load, or is it ornament?
   (`P5`.)
4. **Shaped or generic input?** Is input constrained/opened deliberately to match intent,
   or is it a default text box? (`§10`, `P6`.)

The instrument metaphor is a *way to tell the truth more vividly* (`§10`), not a costume.
That sentence is the hinge of the entire transform.

### 2.2 Per-concept transformation table

| Current UI concept | Conventional job | What it becomes under NC-750 | Driving source rule | Feasibility tension |
|---|---|---|---|---|
| **Generic text field** | Accept arbitrary input anywhere | **Constrained → shaped, one-directional input.** Input is shaped to intent: constrained where you want focus/depth, opened where you want exploration; an explicit "supply evidence" affordance, not a free chat box, on inquiry surfaces | `P6` ("one-directional input over … generic form fields"); `DESIGN_USE.md §10` ("Shape the input to the intent") | Shaping input raises design cost per field and can frustrate power users who expect to type anything; over-constraining becomes a different anti-pattern (a wizard). The rule gives the *stance*, not the line |
| **Feed / infinite scroll** | Endless reverse-chron stream to maximise dwell | **Rejected as a hero object.** Append-only *log* that *collapses* into a terse, re-openable record; it is demoted history, never the centre | `P6` ("over … infinite feeds"); `VI §4` (chat/feed anti-targets); `DESIGN_USE.md §10` ("collapsing log, not a feed"; "demote the turn-by-turn history") | A log that must stay scannable and re-openable is more work than an infinite list; and some legitimate products (a true activity stream) *are* feeds — the worldview offers no sanctioned "honest feed," only rejection |
| **Chat transcript / message bubble** | Symmetric back-and-forth conversation as the main surface | **Replaced.** The exchange is demoted; the *accumulating reading* (what the conversation is building) is promoted to hero. Turns become asymmetric: the instrument *probes*, the user *supplies* — not two peers bubbling | `P6` ("readouts … over chat bubbles"); `VI §2` ("measurements, not conversations"); `VI §4` (chat client anti-target); `DESIGN_USE.md §10` | Hardest where the conversation genuinely *is* the product (open-ended dialogue with no single artifact). The metaphor assumes every exchange is "building" one measurable thing; freeform chat resists that and the worldview has no honest fallback for it |
| **Spinner** | Generic "working" placeholder, indeterminate | **Replaced — *conditionally*.** Becomes **acquisition** (the signal being read) *only when the user is genuinely blocked and waiting on this result*; otherwise becomes a quiet ambient indicator and the user keeps operating | `P9`; `DESIGN_USE.md §10` Latency + `Rule I1` ("never block … for work that could run in the background") | The split foreground/background is a real engineering branch per async call; teams default to one wrapper. "Acquisition theatre" for everything is explicitly forbidden but is the path of least resistance |
| **Progress bar** | Show completion fraction | **Kept *iff* honest; rejected iff faked.** A determinate bar over a genuinely finite, known process is *correct* ("step 3 of 5" is the truth). A faked/decorative percentage is forbidden | `DESIGN_USE.md §10` ("do *not* fake 'saturation' where an honest 'step 3 of 5' is the truth"); `ETHOS C5.5` | Honesty about *unknown* duration is hard: most real progress is partly estimated. The rule draws a clean line (known→bar, unknown→saturation/acquisition) but real work is often in between, and the worldview gives no guidance on honest *estimation* |
| **Skeleton loader** | Fake the final layout to imply imminence | **Rejected (as deception).** It mimics content that isn't there yet — exactly the "invent a reading the system isn't taking" failure. Replaced by acquisition (foreground) or ambient status (background) | `P9`; `DESIGN_USE.md §10` ("never invent a reading"); `P5` (decoration that means nothing is forbidden) | Skeletons exist because perceived-performance matters; removing them may make load *feel* slower. The worldview prioritises honesty over perceived-speed comfort — a real UX cost it accepts without acknowledging |
| **Dashboard / metric card / sparkline** | Grid of hero-metric cards with trend glyphs | **Rejected outright.** Named anti-target. Replaced by: a **non-uniform** band layout (dense chrome paired with open drafting plates), and where live numbers are genuinely measured, an **honest readout in the dark cavity** (coverage/saturation toward "locked"), not a metric card | `VI §4` (SaaS dashboard); `DESIGN_USE.md §6/§7` (`G1` "uniform grids read as dashboards", `G2` pair dense+open, `SF3` live readout uses cavity) | The replacement is specified for *one true live measurement*; for a surface that legitimately needs *many* small metrics at a glance (an actual monitoring console), the anti-uniform-grid rule fights the task. "Don't look like a dashboard" is clearer than "what an honest many-metric surface looks like" |
| **Notification / badge** | Interrupt / count unseen items to pull attention | **Largely silent → inferred constraint.** Closest doctrine: background work shows a *quiet ambient indicator* (breathing LED, header status, console line) and *notify on completion* — i.e. notification is permitted as honest, low-theatre completion signal. Attention-harvesting unread-count badges have no sanctioned form and sit against the ethos (no manipulative pull) | `DESIGN_USE.md §10` Latency/`I1` ("Notify on completion"); `ETHOS C5.1` (no dark patterns, no manipulative defaults) | The worldview never addresses the *unread badge* as a concept. It is the clearest gap: a count is "honest" by the document-grammar logic, yet badges are the canonical engagement dark pattern. Forked to Open Questions |
| **Settings / preferences page** | List of toggles, often marketing-titled sections | **Re-grounded, mostly kept.** Stays a chrome surface (controls/specs live on raised cells); titles state **function not marketing** (`SYSTEM PROPERTIES`, not `Why we're private`); each cell carries a spec-detail address; instrument behaviour "may amount to nothing more than honest live status and well-shaped controls" | `DESIGN_USE.md §5` (`CE2` function titles, `CE1` spec-detail), `§6` (chrome=cell), `§10` ("a dashboard or settings surface → mostly chassis + document grammar") | Low tension — this is the concept that *survives most intact*. The main cost is copy discipline (no marketing section headers) and the spec-detail address on every cell, which is labour, not architecture |
| **Decoration** | Visual delight / brand flavour | **Rejected unless load-bearing.** "Decoration that means nothing is forbidden"; the `0x00` mark is *vocabulary*, not a corner sticker. The accent is a *signal* (≤10%, action/selection/focus/live/null only), never spent on ornament | `P5`, `P8`; `DESIGN_USE.md §13` | Strict "every element must communicate something true" is hostile to delight, warmth, and unmeasured brand personality. Risk: an austere, cold product. The inspiration set hedges this (the single orange accent, knurled detail) but the *rule* admits no purely-pleasing element |
| **Empty state** | Friendly placeholder / illustration when no data | **Re-grounded as honest null.** The natural home of the `0x00` mark — null/zero/none stated as a *true reading*, not a cute illustration with a CTA. An empty surface reads as "zero-state measured," not "oops, nothing here" | `P5` (`0x00` = load-bearing null vocabulary); glossary `0x00` "certifies an absolute zero-state" | Strong conceptually. Tension: onboarding guidance often *lives* in empty states; an austere `0x00` null mark can leave a first-time user without a next step. Honesty vs. hand-holding |
| **Onboarding choreography** | Animated tour / staged reveals to guide first use | **Rejected as choreography.** "No page-load choreography, no scroll-reveals, no bounce" (`MO1`); motion only signals state change or "this cell is live." Guidance must be *documented* (the manual-page grammar), not *performed* | `P9`, `MO1`; `VI §2` Document ("communicate reality … not to sell") | Removing choreography removes a proven aid to first-run comprehension. The document grammar (a manual page) is the sanctioned substitute, but reading a manual is a higher activation bar than a guided animation — a real adoption-friction cost |
| **Modal / dialog** | Interrupt to force a decision, often shadowed/floating | **Constrained, not named.** Not directly addressed, but two rules bind it: no drop-shadow/floating-card elevation (depth is seam + recession + bevel, `P3`/`S2`), and no confirm-shaming/manipulative defaults (`ETHOS C5.1`). A dialog must be a framed cell within the chassis grammar, not a floating glass card | `P3`, `S2` (no floating cards); `ETHOS C5.1`; `VI §4` (Material/Bootstrap anti-target) | The "chassis is always present and never broken" rule (`§2`) is awkward for a true interrupt overlay, which by nature sits *above* the chassis. The worldview doesn't say how an honest modal coexists with "containment." Forked |
| **Navigation (tabs / menus)** | Wayfinding across destinations | **Kept, demoted, re-voiced.** Tabs are an explicit (optional) layer of the screen anatomy; navigation is *chrome* (raised cell). The footer is "a nameplate, not a navigation surface." On mobile, secondary surfaces demote into a bottom tab bar — "one tap away, never deleted" | `DESIGN_USE.md §1` (anatomy: optional TABS), `§3` (`H1` footer = nameplate), `§6` (nav = chrome cell), `§9` | Low-to-moderate tension. The worldview is thin on *deep* navigation (hierarchies, search-as-nav, breadcrumbs); it implicitly assumes shallow, instrument-like surfaces. Deep IA isn't theorised |

### 2.3 Prose — the strongest transforms and the hardest cases

**Strongest transforms (where the worldview genuinely clarifies the concept).**

- **Spinner → conditional acquisition.** This is the cleanest, most defensible transform.
  It replaces a content-free placeholder with a state that is *only shown when true*, and
  it forces the foreground/background distinction (`Rule I1`) that most products blur. The
  honesty rule and the instrument rule align perfectly here, and the result is both more
  truthful and more informative. It is the transform most likely to survive contact with
  real engineering because it maps to a real distinction (blocking vs. non-blocking work).

- **Empty state → honest null (`0x00`).** Re-grounding the empty state as a *measured zero*
  rather than a friendly placeholder is a genuine conceptual upgrade: it turns the most
  neglected screen in most products into a load-bearing statement. The `0x00` mark already
  carries null/zero/none meaning (`P5`, glossary), so the concept and the vocabulary fit
  without strain.

- **Settings page → re-grounded, not replaced.** The most *quietly* important finding:
  the worldview leaves this concept almost intact and only disciplines its *language*
  (function titles, spec-details, honest live status). This is evidence the worldview is a
  re-grounding, not a wholesale replacement (see §2.4).

**Hardest cases (where the metaphor strains or runs out).**

- **Freeform chat / open dialogue.** The worldview is built to demote "the exchange" in
  favour of "the artifact" (`§10`). But some interactions genuinely *are* a symmetric
  conversation with no single measurable artifact. `Rule I2` even warns against forcing the
  probe/readout set where it doesn't fit — yet the worldview offers *no* honest alternative
  for conversation-as-the-product. It rejects the chat client (`VI §4`) without sanctioning
  a successor for the cases where chat is the honest shape. This is the largest conceptual
  hole.

- **Many-metric monitoring.** The dashboard is rejected, and the cavity-readout replacement
  is specified for *one* true live measurement that "accumulates as the user feeds the
  instrument." A surface that must honestly show *many* simultaneous live metrics (a real
  operations console) is exactly a dense, uniform-ish grid of readings — which `Rule G1`
  reads as "looks like a dashboard." The worldview's anti-dashboard reflex can collide with
  a task that legitimately needs a dashboard-shaped honest readout.

- **The notification/badge and the modal.** Both are concepts the worldview barely names.
  Notifications get a single honest hook ("notify on completion"); badges and interrupt
  modals get only negative constraints (no dark patterns, no floating cards) and no positive
  form. These are the asynchronous/ambient surfaces L6 flagged as under-specified.

**The recurring "deep-tool-understanding vs. shallow abstracted use" theme (*Making
Software*, §B.7).** It bears on *every* transform as the underlying justification: the
document grammar exists to *make the machine legible* — to draw the data-flow rather than
write "private by design" (`VI §2`). Each transform that *adds* annotation (spec-details,
`0x00` marks, dimension lines, exploded data-flow schematics) is the UI equivalent of the
exploded floppy-disk diagram: it invites the user to understand the tool rather than use it
blind. The cost is that this is *anti-abstraction* — and abstraction is usability's main
device for reducing load. The worldview bets that *legible density* beats *comfortable
abstraction*. That bet is its boldest claim and its biggest usability risk (§2.5).

### 2.4 The meta-question — reduction, re-grounding, or re-skin?

**Argued from the data: it is predominantly a *re-grounding in honesty*, with a strong
*documentary-addition* character, and explicitly *not* a re-skin — and only incidentally a
reduction.**

- **Not a re-skin.** The constitution forbids the re-skin reading in its own terms:
  identity is structural, not chromatic (`P1`); the migration note draws the exact line
  between "looks like the Lab" and a "generic dark dashboard" (`§14`). A surface can carry
  every correct token and still *fail* if it reads as a dashboard/chat/terminal (`VI §4`).
  So the change is to *behaviour and meaning*, not appearance.

- **Re-grounding in honesty is the dominant mode.** The decisive evidence is the
  *asymmetry of treatment*: concepts are kept or killed based on whether they can be made
  *true*, not on how they look. The progress bar is kept when honest and rejected when
  faked (`§10`). The settings page survives almost untouched because it was never dishonest
  — only marketing-voiced (`CE2`). The spinner is replaced because it is content-free, the
  skeleton because it is deceptive. The organising principle is "the instrument metaphor is
  a way to tell the truth more vividly" (`§10`) and "claims literally true" (`ETHOS C5.5`).
  That is a *re-grounding*: same concepts, re-anchored to truth.

- **Documentary *addition*, not reduction.** The "utilitarian" thesis is *not* minimalism
  (L5). The document grammar *adds* part numbers, spec-details, registration marks,
  data-flow schematics (`VI §2`; §B.8–B.11). The system is denser, not sparser. Where it
  reduces (no decoration, no choreography, one signal ≤10%), the reduction is a *byproduct*
  of the honesty rule (cut what carries no true load), not the goal. So "reduction" is the
  weakest of the three readings — true only in the narrow sense of "remove the untrue and
  the merely decorative."

- **One honest concession.** The worldview *does* have an aesthetic layer (chassis, seams,
  cavity, the specific Lab look) that is not strictly derivable from honesty — a fully
  honest UI need not look like a machined enclosure. So a *minority* of the system is an
  aesthetic stance. But the constitution subordinates that aesthetic to the structural/
  honest core (`P1`, `§14`), so the re-skin reading remains secondary.

**Verdict, balanced:** NC-750's "utilitarian computing" is a **re-grounding of UI concepts
in verifiable honesty, expressed through a documentary (legible-density) grammar**, wearing
a coherent industrial aesthetic. It is not a reduction of *concepts* (it adds annotation)
and not a re-skin (it changes behaviour and meaning, not just colour).

### 2.5 Balanced strengths and weaknesses

**Strengths.**
- **A single, checkable test** (artifact / honest / document / shaped) gives a principled,
  non-arbitrary way to decide any concept's fate — rare in a design system.
- **Honesty is structurally enforced**, not aspirational: the `0x00` mark may only sit on a
  genuine zero-state (`ETHOS C8.2`), claims must be literally true (`C5.5`), no fake meters
  (`§10`). The ethics are wired into the components, not the copy.
- **It rehabilitates maligned concepts** (the step indicator, the settings page) rather than
  reflexively replacing them — evidence of a mature, non-zealous doctrine (`§10`, `I2`).
- **The foreground/background latency split** (`I1`) is a genuinely useful engineering
  distinction most systems lack.

**Weaknesses / tensions.**
- **Anti-abstraction vs. usability.** The legible-density bet (L5) runs against the
  usability tradition that reduces load *via* abstraction. An instrument-dense UI can be
  *more* cognitively demanding for a casual user, not less — the opposite of "utilitarian"
  in the ergonomic sense.
- **Under-specification of ambient/async/wayfinding surfaces** (L6): notifications, badges,
  interrupt modals, deep navigation, and many-metric honest monitoring are thin or silent.
  The worldview is sharpest for *foreground inquiry* and *documentary* surfaces and vaguest
  elsewhere.
- **No honest successor to conversation-as-product.** Rejecting chat without sanctioning a
  replacement for genuinely conversational products is a real hole.
- **Cost asymmetry.** Honest, shaped, per-task transforms (shaped input, foreground/
  background branching, bespoke readouts, spec-details everywhere) are *more* expensive to
  build than the generic concepts they replace. The worldview's correctness is paid for in
  per-surface design and engineering labour — a real adoption tension it doesn't cost out.
- **Austerity risk.** "Decoration that means nothing is forbidden" (`P5`) can yield cold,
  joyless surfaces; the system leans on a single accent and machined detail to supply
  warmth, which is a narrow margin.

---

## 3. Open questions for the user (genuine forks the source can't resolve)

1. **The unread badge / attention notification.** The worldview sanctions "notify on
   completion" (`§10`) but never addresses the *unread-count badge* or attention-pulling
   notification as a concept. By document-grammar logic a count is "honest"; by ethos logic
   (`C5.1`, no manipulative pull) the engagement badge is suspect. **Is there a sanctioned
   honest form of "you have N unseen items," or is the badge simply out of scope / rejected?**

2. **The interrupt modal vs. "the chassis is never broken."** Containment (`P2`, `§2`) says
   the chassis is always present and never broken, yet a true interrupt dialog sits *above*
   everything. **Does an honest modal live *inside* the chassis as a framed cell (no
   overlay), or is a chassis-breaking overlay permitted for genuine interrupts?**

3. **Conversation-as-the-product.** When the artifact genuinely *is* the dialogue (no single
   measurable output), `I2` warns against forcing the probe/readout set, but no alternative
   is given. **What is the honest instrument form for an open-ended conversation, or is such
   a product simply out of scope for the NODE layer?**

4. **Many-metric honest monitoring.** The dashboard is rejected and the cavity readout is
   specified for *one* accumulating measurement. **What does an honest surface showing many
   simultaneous live readings look like, given `G1` reads any uniform metric grid as a
   dashboard?**

5. **Honest progress under genuinely uncertain duration.** Known→bar, unknown→saturation/
   acquisition is clear, but most real work is *estimated* (partly known). **Is an honest
   *estimated* progress indication permitted, and how is it distinguished from a "fake
   meter"?**

---

## 4. Questions for Context (Agent 1)

1. **Is there any source passage** (in `DESIGN.md`, `PRODUCT.md`, or elsewhere outside my
   permitted reading set) that addresses **notifications, badges, or interrupt modals** as
   components? My permitted sources are silent/near-silent on them; confirm whether the
   silence is real across the full corpus or an artifact of my restricted reading scope.

2. **Does any source define an "honest feed" or "honest many-metric" surface** beyond the
   anti-dashboard / anti-feed *rejections* I cited (`VI §4`, `G1`, `§10`)? I found only
   negation; confirm whether a positive specification exists elsewhere.

3. **`0x00` on empty states** — I inferred the empty state as the natural home of the `0x00`
   null mark from `P5` + the glossary ("certifies an absolute zero-state"). Is there an
   explicit source statement tying `0x00` to empty/zero-data *UI states* (as opposed to the
   zero-*tracking* certification in `ETHOS C8.2`), or is that inference mine to own?

---

*End of Agent 3 analysis. Altitude held at the level of UI concepts; no framework, code, or
product instance used as a worked example.*
