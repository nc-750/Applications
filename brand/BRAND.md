This master dossier compiles the core identity, visual philosophy, and product naming architecture of the **NC-750** brand universe. It is structured explicitly for consumption by Large Language Models to establish strict guidelines for copywriting, UI/UX implementation, product roadmap expansion, and market positioning.

---

## 1. Brand Genesis & Core Philosophy

### The Inception

The brand originally began as an exploration of the "Cassette Futurism" art style under the design working name *NeoCassette* (which established the legacy `nc` prefix across its code and system assets). As the design system evolved, it shifted from plastic retro-nostalgia to a heavier, machined, industrial aesthetic known as *Enclosure Design*. To establish an alternative, uncompromising technological identity, the parent brand was formally designated as **NC-750**—derived directly from low-level system layout variables and internal hardware module identifiers (`// MODULE NC-750-B`).

### The Pillars

NC-750 operates at the intersection of premium industrial design (inspired by the ethos of *Nothing* and *Teenage Engineering*) and absolute user sovereignty. The brand rejects standard Web2 corporate models in favor of a strict, technical manifest:

* **Total Data Ownership:** User content is local-first by default and belongs to the user alone. It is never written to an NC-750 server, never sold, and never used to train anything. When a feature genuinely needs to send content somewhere (for example, an AI request), it travels only to the destination the user is on for that request — and a fully local, nothing-leaves-the-device path is always available.
* **You Are Never the Product:** NC-750 collects nothing *about a person* by default. Any metrics about a *product* are opt-in, off by default, anonymous, aggregate, self-hosted, and never linked to an individual or their content — and whatever is collected is published in plain words. Operational data that necessarily crosses our own infrastructure (downloads, billing, license checks) is *counted*, never the person behind it. This is the honest form of the brand's original anti-telemetry stance: the commitment is **no person is tracked**, not the literally-false absolute that *no number is ever counted*. The premium feature is integrity, not a compliance checkbox.
* **Bring Your Own Key (BYOK), or a No-Log Relay:** For AI processing, users may supply their own API key (content goes straight to their chosen provider) or run a fully local model (nothing leaves the device at all). An optional NC-750-hosted relay exists purely for zero-setup convenience; when used, it is stateless and content-free by design — it forwards the request and retains nothing. Corporate mediation, hidden data harvesting, and lock-in are removed on every path.
* **Themeable Minimalist Structuralism:** Interfaces prioritize dense, highly organized geometric layouts that pair structural stability with an expressive, infinitely shifting color spectrum.

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

The hexadecimal notation for a null byte—**`0x00`**—serves as the official graphic stamp. Placed on visual layouts or hardware corners, it acts as a technical signature certifying an absolute zero-data-tracking environment.

### `NC-750`

The brand uses its name as its logo.

---

## 3. Visual & Typographic Guidelines

The visual identity of NC-750 is governed by the *Enclosure Design* system, defined by an unchanging structural frame housing a fluent, themeable emissive color palette.

### Layout & UI/UX Principles

* **Panels Joined by Seams:** Visual blocks must be separated by crisp, tight geometric seams rather than drop-shadows or gradients. The layout must feel machined, dense, and physically enclosed.
* **Themeable Foundations:** The system is a fully configurable theme engine in the spirit of Material You — both the base seed color and the accent color are user-selectable. All major surface and text tokens derive from the base seed (`--nc-seed-h/s/l`), while accent-dependent elements (primary actions, focus rings, active signals) derive from the accent seed (`--nc-accent-h/s/l`). The canonical default pair is a cool steel-blue base with a high-contrast safety-orange accent (`hsl(18, 100%, 53%)`), but the user may freely retheme both. The following screenshots show the range of base hues achievable by changing `--nc-seed-h` alone:
* *Light Steel Field / Machined Aluminium* (`screenshots/metallic_cyan_light.png`)
* *Gunmetal Console / Dark Theme* (`screenshots/metallic_cyan_dark.png`)
* *Vivid Magenta / Crimson Field* (`screenshots/pink_light.png`, `screenshots/pink_dark.png`)
* *Organic Sage / Forest Green Console* (`screenshots/green_light.png`, `screenshots/green_dark.png`)



### Typography Hierarchy

The contrast between font weights and tracking serves as the primary "voice" of the brand system:

| Layer | Font Style / Family | Formatting Rules | Target Placement |
| --- | --- | --- | --- |
| **Display / Numerals** | *ClashDisplay* | Enormous, ultra-heavy weight, tight tracking | Primary hero statements, massive metrics, branding headers |
| **Headings & Body** | *Chillax* | Clean, highly legible, calm semantic density | Explanatory text, feature subheads, paragraph blocks |
| **Technical Labels** | Monospace Family | Monospace, tiny sizing, wide-tracked letter spacing, often uppercase | System variables, component versions, button labels, UI metadata |

---

## 4. Product Case Study: **Mirror**

### Product Profile

* **Official Designation:** `Mirror (NODE-0M) by NC-750` (formerly conceptualized as "Persona").
* **Core Utility:** A deeply analytical career reflection tool. It conducts a text-based, conversational AI interview based on a user's dropped raw context (CV, LinkedIn exports, markdown text), exposes overlooked professional patterns, and outputs two documents: a private insight dossier and a polished public profile.
* **Privacy Stance:** Operating entirely locally with a "Bring Your Own AI Key" architecture. It requires no user accounts, and outputs the finished assets as a self-contained, offline HTML file with zero remote script dependencies.

### Landing Page Implementation (`screenshots/landing_page_01.png` & `screenshots/landing_page_02.png`)

* **The Hero Copy Alignment:** The name *Mirror* reinforces the concept of honest, objective self-appraisal without Web2 marketing hyperbole:
> ## Your career, understood honestly.
> 
> 
> Mirror interviews you with AI, finds patterns you missed, and produces a private insight document and a polished public profile. Nothing leaves your device.


* **Call-to-Action Execution:** Primary conversion elements use the system's signature safety-orange signal field paired with solid black ink typography: `[ Download Mirror ]`.
* **Product Framing:** Marketing text balances high-end human utility ("Surgical precision," "Yours forever") with literal system capabilities ("No server. Stored securely on your device. Host them, or email them; they're yours.").
