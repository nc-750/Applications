# OPEN QUESTIONS — consolidated, deduplicated, prioritised

> **STATUS (2026-06-21): ALL NINE ANSWERED by the brand author.** Each item below now carries a
> `**RESOLVED →**` line summarising the author's answer; the full updated analysis is in
> `04-resolved-understanding.md`. Three genuinely-open successors survive (now `U1`–`U3` in
> `04 §5`): per-feature visual-integration research, ecosystem-refusal criteria, and the honest-
> *estimated*-progress convention. The original fork text is kept verbatim for traceability.
>
> **Owner.** Agent 4 (synthesis), folding in every genuine "open question for the user" raised
> by Agent 2 (philosophical), Agent 3 (technical), and Agent 4 itself. Each item is a real fork
> the four source documents **cannot** resolve — not manufactured doubt. Deduplicated across
> agents (several agents raised overlapping forks; merged here). **Ordered by how much the answer
> would change the brand's direction** — strategic/identity forks first, then doctrine gaps, then
> scoped component gaps.
>
> Sourced from: `01-philosophical-analysis.md §3`, `02-technical-analysis.md §3`, and
> `03-synthesis.md §5`. "Raised by" credits the originating agent(s).

---

## Tier 1 — Strategic / identity forks (change what the brand *is*)

### OQ-1 — Is "instrument over app" a universal design law, or a deliberate audience filter?
**The fork.** The source asserts "instrument over app / operated, not used" universally
(`VISUAL_IDENTITY.md §3 P6`), but the philosophy only coheres for a self-directed, curious
operator who *wants* to read a gauge ("study this", `P4`; the *Making Software* deep-understanding
thesis, dossier B.7). It has no stated answer for the user who wants to be **carried** — to use,
not operate. Is this *the* correct way to build software, or *our* way that selects a specific
user?
**Why it matters.** Decides the entire addressable market and whether "operated, not used" is
defended as truth or owned as a positioning choice. If it's a filter, the brand should say so;
if it's a law, the source never argues it for the user who prefers "used."
**Raised by.** Agent 2 (B1, §3.1); echoed as a residual blind spot by Agent 4 (R4).
**RESOLVED →** Neither: it is a **deliberate stance, pragmatically applied.** Intent = reverse
anticipatory computing — *the system reacts to the user; the user initiates and is the sole
interpreter*. Prediction-by-purpose apps are fine if **user-initiated**. The "carried" user is an
**accepted audience filter** (the brand proposes, doesn't impose — see OQ-2). Reframes Q1 around
agency, not measurement (`04 §2, K1`).

### OQ-2 — Is honesty-as-premium a value claim or a market hypothesis — and which governs when they diverge?
**The fork.** `BRAND.md §1` states "The premium feature is integrity" as settled fact, but the
constraints frame integrity as an acquisition strategy ("help the user stop paying when done",
`ETHOS C5.2`). When the honest move *costs a sale*, which governs? The source treats "this is
right" and "this will sell" as the same thing and never separates them.
**Why it matters.** It is the brand's biggest bet. If the bet fails commercially, nothing in the
source tells you which constraint bends first (see OQ-8). Whether integrity is a virtue or a
falsifiable wager determines how the brand reacts under revenue pressure.
**Raised by.** Agent 2 (B2, §3.2).
**RESOLVED →** A **value claim that governs**. The author would lose a sale before breaking trust,
and accepts that cost; the brand **proposes, not imposes**, self-selecting like-minded users.
Honesty is not a falsifiable market bet (`04 §1 K6`).

### OQ-3 — What is the honest instrument form for conversation-as-the-product?
**The fork.** The worldview demotes "the exchange" in favour of "the artifact" (`DESIGN_USE.md §10`)
and rejects the chat client (`VISUAL_IDENTITY.md §4`) — but some interactions genuinely *are* a
symmetric dialogue with no single measurable artifact. `Rule I2` even warns against forcing the
probe/readout/saturation set where the task isn't a sustained foreground inquiry, yet **no honest
successor is sanctioned**. Is open-ended conversation simply out of scope for the NODE layer, or
does it have an instrument form the source hasn't named?
**Why it matters.** This is the largest *conceptual hole* and the sharpest disagreement surfaced
between the two analyses (synthesis T2): Agent 2's universal Q1 definition ("surface a reading of
a real quantity") fails exactly here. It determines whether a whole class of AI products can wear
the NC-750 mark at all.
**Raised by.** Agent 3 (hardest case §2.3, OQ-3); adjudicated as the core tension by Agent 4 (T2).
**RESOLVED →** Not a hole — **deliberately case-by-case.** When a form is intrinsic (chat, map),
**keep the familiar form and integrate it visually**; the research is "how to present it," not
"how to transform usage." If too divergent, keep familiar UI/UX; some cases have no alternative.
The agency framing (K1) removes the contradiction. Successor design work tracked as **U1** (`04 §5`).

### OQ-4 — Curiosity vs. utility: which is "instrument" actually about?
**The fork.** *Making Software* (dossier B.7), the cited north star, says in its own words "there's
nothing actionable in here… you just need to be curious" — an *epistemic/aesthetic* stance
(understanding for its own sake). NC-750 inherits that deep-understanding aesthetic but markets it
under a *utility* banner ("operated like instruments", "utilitarian computing"). These are not the
same value and the brand does not reconcile them.
**Why it matters.** They point at different product decisions — does a feature earn its place by
helping the user *get work done* (utility) or by *exposing the machine honestly* (epistemic)? The
"utilitarian" framing of the entire Q2 transformation rests on this unresolved equivocation.
**Raised by.** Agent 2 (B3, §3.3) **and** Agent 3 (L5, §2.3) independently — strong signal.
**RESOLVED →** **Utility.** A feature earns its place by helping the user get work done; *the
internals can be hidden.* The epistemic/curiosity reading came from *Making Software*, which the
author **never read** (it entered via LLM assistance) — so it is **not a brand value and is
retracted** as load-bearing. "Document over decoration" = honesty of *claims*, not exposing
internals for understanding (`04 §1 K2`).

---

## Tier 2 — Doctrine gaps (change how a rule is applied at the edges)

### OQ-5 — Where does the "integrity, not absolutism" partition bend, and is there an aggregate threshold?
**The fork.** The brand holds an absolutist *voice* (`0x00` "absolute zero-data-tracking",
`BRAND.md §2`) over a graduated *charter* ("integrity, not absolutism", `ETHOS §0`). It stays
coherent per-claim (`0x00` never on a `C1.6` surface, `C8.2`; per-path truth, `C5.5`). But if a
future NODE genuinely cannot offer a local path and accumulates many `C1.6` (data-required)
surfaces, **at what point does the absolutist voice become misleading even though every individual
claim is literally true?** The source gives a per-claim rule but **no aggregate threshold**.
**Why it matters.** It is the failure mode of the brand's single most distinctive move. Without an
aggregate rule, the voice can drift away from the reality one literally-true claim at a time.
**Raised by.** Agent 2 (§3.4); flagged as residual by Agent 4 (R1).
**RESOLVED →** **Update the voice.** The brand started absolutist but should now speak in a
**pragmatic, realistic, honest** register matching the graduated charter. Once the voice stops
sounding absolutist, the "aggregate-honesty threshold" worry largely evaporates — there is no
absolutist promise left for accumulated true-but-graduated claims to betray (`04 §1 K4`).

### OQ-6 — Many-metric honest monitoring: what does it look like when the dashboard is rejected?
**The fork.** The dashboard is a named anti-target (`VISUAL_IDENTITY.md §4`) and `Rule G1` reads any
uniform metric grid as one. The sanctioned replacement — the dark-cavity readout (`§6 SF3`) — is
specified for **one** accumulating live measurement. But a legitimate operations console must show
**many** simultaneous live readings honestly. What does that surface look like, given the
anti-uniform-grid reflex fights the task?
**Why it matters.** "Don't look like a dashboard" is specified; "what an honest many-metric surface
*is*" is not. Any real monitoring NODE hits this immediately.
**Raised by.** Agent 3 (§2.3 hardest case, OQ-4); resolved-context query (b) confirmed no positive
spec exists in-corpus.
**RESOLVED →** Folded into OQ-1/OQ-3: if an honest dashboard is genuinely needed and can't be
reworked, **keep it and fit it into the visual language as best as possible.** The `§4` anti-
dashboard rule targets the *attention-seeking pattern*, not the *form*. The author notes the
**document phrasing should change** to remove the apparent contradiction (`04 §1 K5, §4`).

### OQ-7 — Is honest *estimated* progress permitted, and how is it distinguished from a fake meter?
**The fork.** The rule is clean at the poles — known duration → determinate bar ("step 3 of 5"),
unknown duration → saturation/acquisition (`DESIGN_USE.md §10`). But most real work is *partly
estimated* (neither fully known nor fully unknown). Is an honest estimated progress indication
permitted, and what separates it from the forbidden "fake meter"?
**Why it matters.** Nearly every real loading/processing state lives in this middle. The source
gives no guidance on honest *estimation*, so teams will either over-claim (fake precision) or
over-hide (acquisition theatre).
**Raised by.** Agent 3 (§2.3, OQ-5).
**RESOLVED →** **Permitted** if the estimate is genuinely honest; only *lying* (fabricated
precision) is forbidden. Also resolves the T3 "look can show false data" critique as a **false
weakness**: verifying the *trueness* of input data is an **app-domain concern, out of brand
scope** — the brand guarantees *presentational* honesty, not validation of world data (`04 §3 K3`).
Open successor (the convention that visibly marks an *estimate* vs a *measurement*) = **U3** (`04 §5`).
Author also raises an **ecosystem-refusal** lever → new open item **U2**.

---

## Tier 3 — Scoped component gaps (change one surface, not the identity)

### OQ-8 — The unread badge / attention notification: sanctioned honest form, or rejected?
**The fork.** The worldview sanctions "notify on completion" (`DESIGN_USE.md §10`, `I1`) but never
addresses the *unread-count badge* or attention-pulling notification. By document-grammar logic a
count is "honest"; by ethos logic the engagement badge is the canonical dark pattern
(`ETHOS C5.1`, no manipulative pull). Is there a sanctioned honest "you have N unseen items", or is
the badge simply out of scope / rejected?
**Why it matters.** It is the clearest collision between the document grammar (a count is true) and
the ethos (badges harvest attention). Left unanswered, every product invents its own answer.
**Raised by.** Agent 3 (L6, §2.3, OQ-1); resolved-context query (a) confirmed the silence is real
*within the permitted corpus* (the wider project `DESIGN.md`/`PRODUCT.md` were out of scope, so this
may already be answered elsewhere — **worth checking the full corpus before treating as open**).
**RESOLVED →** Governed by OQ-1/OQ-3/OQ-4: an unread-count badge / attention notification is judged
by whether it **harvests attention or steers the user** (rejected pattern) vs. honestly reports a
true count the user asked to track (permissible). Decided per feature under the "less attention-
seeking, pragmatic" aim (`04 §4`).

### OQ-9 — The interrupt modal vs. "the chassis is never broken."
**The fork.** Containment says the chassis is always present and never broken (`VISUAL_IDENTITY.md §2`,
`P2`), yet a true interrupt dialog by nature sits *above* everything. Does an honest modal live
*inside* the chassis as a framed cell (no overlay), or is a chassis-breaking overlay permitted for
genuine interrupts? (Bounded only negatively so far: no drop-shadow/floating-card, `P3/S2`; no
confirm-shaming, `C5.1`.)
**Why it matters.** Decides whether one of the most common UI patterns even *has* a legal form in
the system. Lower stakes than Tier 1–2 but hit constantly in practice.
**Raised by.** Agent 3 (L6, §2.3, OQ-2); resolved-context query (a) confirmed no in-corpus modal
spec.
**RESOLVED →** Modals/overlays **are permitted.** The visual language is intended to be **more
dynamic than documented** — disabled states, overlays/modals, and even **bands/cells replaced by
app status** are legitimate. It "mimics a physical world but lives in a more flexible virtual one";
early and evolving, *nothing set in stone*. Loosens the apparent rigidity of `P2`/`P3` (`04 §1 K7`).

---

## Note on scope of the "silence" forks (OQ-6, OQ-8, OQ-9)
The component-gap forks rest on silence *within the four permitted documents* (`BRAND.md`,
`VISUAL_IDENTITY.md`, `DESIGN_USE.md`, `ETHOS.md`). The wider project (`lab/DESIGN.md`,
`lab/PRODUCT.md`, shipped `mirror/` code) was deliberately out of analysis scope. Before treating
these as genuinely unresolved at the *project* level, confirm the silence across the full corpus —
they are confirmed open only for the constitution + charter layer.

---

*End of consolidated open questions.*
