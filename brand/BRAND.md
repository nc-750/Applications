This master dossier compiles the core identity, philosophy, voice, and product naming architecture of the **NC-750** brand universe. It is structured explicitly for consumption by both humans and Large Language Models to establish strict guidelines for copywriting, product roadmap expansion, and market positioning.

**Related documents.** `brand/ETHOS.md` — the binding product constraints (privacy, data, monetization). `brand/VISUAL_IDENTITY.md` — the visual worldview (the Lab design system). `lab/DESIGN.md` — visual tokens and components. `lab/DESIGN_USE.md` — how to apply them. **This file owns identity, voice, and naming; it defers all visual specifics to `VISUAL_IDENTITY.md`.**

---

## 1. Brand Genesis & Core Philosophy

### The Inception

The brand originally began as an exploration of the "Cassette Futurism" art style under the design working name *NeoCassette* (which established the legacy `nc` prefix across its code and system assets). As the design system evolved, it shifted from plastic retro-nostalgia to a heavier, machined, industrial aesthetic, and then matured into its current form — the **Lab** design system: *machine-documentation instrument panels*, where software is presented as a precision laboratory instrument documented like a technical manual (see `brand/VISUAL_IDENTITY.md`). To establish an alternative, uncompromising technological identity, the parent brand was formally designated as **NC-750**—derived directly from low-level system layout variables and internal hardware module identifiers (`// MODULE NC-750-B`).

### The Pillars

NC-750 operates at the intersection of premium industrial design (inspired by the ethos of *Nothing* and *Teenage Engineering*) and user sovereignty. Its register is pragmatic and plain-spoken, not absolutist: it makes only the few absolute promises it can actually keep (see *Data Integrity* below) and states everything else as the honest, verifiable, per-path truth. NC-750 *proposes* this technical manifest rather than imposing it — it would rather lose a sale than compromise a user's trust, and it self-selects like-minded people. The brand declines the standard Web2 model of anticipating and monetising the user; the person who wants to be carried by such an ecosystem is simply not who it is for. The manifest:

* **Data Integrity, Not Absolutism:** User content belongs to the user, and the brand's promise is *integrity in how data is collected and used* — not a literally-false absolute. The goal is **zero user-data collection wherever that is possible**, with a local-first, nothing-leaves-the-device path as the default and offered wherever feasible. Where a product or feature genuinely cannot exist without data — for example, training an NC-750 model — the next-best solution is implemented openly: the minimum necessary, with informed, opt-in consent, disclosed in plain words, never repurposed beyond the stated function. **One line is absolute and is never crossed: user data is never sold.** Everything else is the discipline of doing the most honest, least-extractive thing the function allows.
* **You Are Never the Product:** NC-750 collects nothing *about a person* by default. Any metrics about a *product* are opt-in, off by default, anonymous, aggregate, self-hosted, and never linked to an individual or their content — and whatever is collected is published in plain words. Operational data that necessarily crosses our own infrastructure (downloads, billing, license checks) is *counted*, never the person behind it. This is the honest form of the brand's original anti-telemetry stance: the commitment is **no person is tracked**, not the literally-false absolute that *no number is ever counted*. The premium feature is integrity, not a compliance checkbox.
* **Bring Your Own Key (BYOK), or a No-Log Relay:** For AI processing, users may supply their own API key (content goes straight to their chosen provider) or run a fully local model (nothing leaves the device at all). An optional NC-750-hosted relay exists purely for zero-setup convenience; when used, it is stateless and content-free by design — it forwards the request and retains nothing. Corporate mediation, hidden data harvesting, and lock-in are removed on every path.
* **Structural, Not Chromatic, Identity:** The visual identity is carried by structure — a framed chassis, dense geometric layouts, crisp seams, recessed readouts — not by any single palette. Colour is a user-owned variable; the system stays unmistakably NC-750 in any theme. (Defined in `brand/VISUAL_IDENTITY.md`.)
* **The System Reacts to You:** NC-750 software responds to the user; it does not predict, steer, nudge, or harvest in order to act on the user's behalf. *You* initiate the action and *you* remain the sole interpreter of what your data means — the software presents honest state and waits. This is the deliberate opposite of the prevailing model that gathers data to guess your next move and quietly runs the session for you. Where a product's *purpose* is prediction or analysis (a scientific tool, a route planner), it still acts only when you ask it to, and the result is yours to read. This is the brand's governing stance; its visual expression is `VISUAL_IDENTITY.md` P10 (and P6).

---

## 2. The Product Architecture (`NC-750` Matrix)

Rather than using traditional consumer marketing names, NC-750 utilizes a rigid, alphanumeric serialization structure across its entire product universe. This frames each product as a precise, low-level system primitive or engineering tool.

### `NODE-XX` (Software Ecosystem)

* **Definition:** Represents software points of connection within a decentralized, local-first network.
* **Aesthetic Integration:** Software titles combine a clean human noun with a dedicated system suffix pinned to the product name (e.g., `NODE-0M` for Mirror).
* **UI Formatting:** System execution logs and headers use strict lowercase wide-tracked monospace syntax: `sys // node-0m // active`.

### `UNIT-XX` (Hardware Line)

* **Definition:** Represents physical, modular hardware components, machine enclosures, or self-hosted server chassis.
* **Aesthetic Integration:** Heavy-duty, tactile items (e.g., milled-aluminum hardware keys, local-first network arrays).
* **Chassis Formatting:** Stamped or laser-etched directly onto physical casings using clean, minuscule typography: `NC-750 // UNIT-01 // LOCALHOST`.

### `CORE-XX` (System Primitives)

* **Definition:** Reserved for the underlying, invisible infrastructure: open-source protocol libraries, database architectures, or system-wide configuration files running directly on bare metal.

### The Cryptographic Mark: `0x00`

The hexadecimal notation for a null byte—**`0x00`**—serves as the official graphic stamp. Placed on visual layouts or hardware corners, it certifies a genuine zero-collection, zero-person-tracking environment — and *only* that. It is one of the brand's few literal absolutes (`ETHOS.md` C8.2): it is applied solely where collection is truly zero, never as decoration on a surface that does collect data.

### `NC-750`

The brand uses its name as its logo.

---

## 3. Visual & Typographic Guidelines

The NC-750 visual language is the **Lab design system** — *machine-documentation instrument panels*. This file does not duplicate its specifics; the following are the single sources of truth:

* **`brand/VISUAL_IDENTITY.md`** — the worldview: the three grammars (Chassis, Document, Instrument) and the founding principles.
* **`lab/DESIGN.md`** — tokens, the colour-seed engine, the typography scale, and the component catalogue.
* **`lab/DESIGN_USE.md`** — how to assemble them: layout, responsive, motion, and interaction rules.

In one line: a framed, textured **chassis** holds cells joined by crisp 1px **seams**; diagrams and readouts sit on recessed **drafting plates**; a single loud accent acts as a **signal**, never decoration; type runs at extreme contrast (heavy display against tiny wide-tracked mono labels); and the identity is **structural, not chromatic** — it survives any user-chosen theme. Products are *operated like instruments*, not browsed like apps.

---

## 4. Product Case Study: **Mirror**

### Product Profile

* **Official Designation:** `Mirror (NODE-0M) by NC-750` (formerly conceptualized as "Persona").
* **Core Utility:** A deeply analytical career reflection tool. It conducts a text-based, conversational AI interview based on a user's dropped raw context (CV, LinkedIn exports, markdown text), exposes overlooked professional patterns, and outputs two documents: a private insight dossier and a polished public profile.
* **Privacy Stance:** Local-first with a "Bring Your Own AI Key" architecture — the app runs on the device, and the only thing that ever leaves it is an AI request the user explicitly makes, which goes to the provider the user chose (or nowhere at all, with a local model). It requires no user accounts, and outputs the finished assets as a self-contained, offline HTML file with zero remote script dependencies.

### Voice in practice

Mirror demonstrates the NC-750 voice applied — honest, technical, free of Web2 marketing hyperbole:

* **Hero:** the name *Mirror* reinforces honest, objective self-appraisal:
> ## Your career, understood honestly.
>
> Mirror interviews you with AI, finds patterns you missed, and produces a private insight document and a polished public profile. No account, no NC-750 server — your words go only where you send them.

* **Call to action:** primary actions use the accent signal with plain, verb-first labels: `[ Download Mirror ]` — no fake urgency, no dark patterns (`ETHOS.md` §5).
* **Framing:** copy balances human utility ("understood honestly," "yours forever") with literal system truth ("No server. Stored on your device; host them or email them — they're yours."). Every claim is literally true (`ETHOS.md` C5.5) — note the hero deliberately says *"your words go only where you send them"* rather than the tempting absolute *"nothing leaves your device,"* which would be false on the BYOK path where the user sends a request to their chosen provider. State the per-path truth, never the convenient absolute.

The interview interface — Mirror as an **instrument** rather than a chat — is the reference example in `lab/DESIGN_USE.md` §10. Production-grade visual examples will be authored separately once the system stabilises.
