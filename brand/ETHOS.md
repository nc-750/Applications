# The NC-750 Ethos — Binding Product Constraints

This document is the **compliance charter** for the NC-750 universe. Every product —
every `NODE-XX` (software), `UNIT-XX` (hardware), and `CORE-XX` (infrastructure) —
MUST satisfy these constraints to carry the NC-750 name. `BRAND.md` is the *why*
(philosophy, voice, naming). This file is the *what you may and may not ship*.

The brand's promise is **integrity, not absolutism**. The point of these rules is
that NC-750's claims are *literally true* — a privacy posture you can verify in a
network tab, not a slogan. A product that breaks one of these constraints does not
get a brand exception; it gets fixed, or it ships without the NC-750 mark.

Language: **MUST / MUST NOT** are hard requirements. **SHOULD** is a strong default
that needs a written, honest reason to deviate.

---

## 1. Content & Data Ownership

The default is **zero collection**. This section is a tiered discipline: collect nothing
wherever the function allows; where a function genuinely cannot exist without data, fall
back to the most honest, least-extractive option under C1.6; and never cross the one
absolute line — **user data is never sold.**

- **C1.1** User content (anything the user authors, uploads, or generates — documents,
  answers, personas, outputs) MUST be local-first by default and MUST NOT be written to an
  NC-750-owned server **unless** the feature genuinely requires it, in which case C1.6
  applies in full.
- **C1.2** User content MUST NEVER be **sold** or shared for advertising — this is
  absolute and admits no exception. It MUST NOT be used to train any model **except** with
  the user's informed, opt-in consent given specifically for that purpose, under C1.6.
- **C1.3** A **fully local path** (nothing leaves the device) MUST be offered wherever it
  is technically feasible, and SHOULD be the default. Where the core function is impossible
  without transmitting or collecting data, the product MUST say so plainly and name exactly
  what data goes where, and why.
- **C1.4** When content must be transmitted (e.g., an AI request), it MUST go *only*
  to the destination required for that request, and the product MUST document —
  in plain words — precisely what is sent and to whom (see `mirror/.../privacy.md`
  as the reference standard).
- **C1.5** The user MUST be able to export and hard-delete all of their **local** data with
  no remote copy left behind, and MUST be able to request deletion of any data legitimately
  collected under C1.6.
- **C1.6 (Fallback tier — when data is genuinely required).** A product or feature that
  cannot function without collecting user data MUST, at minimum: (a) collect only the
  **minimum necessary** for the stated function; (b) obtain **informed, opt-in consent**,
  off by default, with a plain-words explanation; (c) use the data **only** for the
  disclosed purpose — never repurposed, never sold (C1.2); (d) **publish** what is
  collected, why, where it is stored, and for how long; (e) provide deletion on request
  (C1.5). A feature operating in this tier MUST NOT carry the `0x00` zero-tracking mark for
  the data it collects (see C8.2); `0x00` certifies genuine zero-collection only.

## 2. Telemetry & Measurement

- **C2.1** No product may collect data **about a person**. Measurement is about the
  *product*, never the individual.
- **C2.2** Any client-side telemetry MUST be **opt-in and off by default**, with a
  plain-words explanation of every field sent.
- **C2.3** Telemetry MUST be **anonymous and aggregate**. It MUST NOT carry a
  persistent unique identifier, precise timestamps usable for fingerprinting, or any
  user content. Prefer stateless events; a per-session ephemeral ID is the maximum.
- **C2.4** **No third-party analytics SaaS.** No Google Analytics, Mixpanel-cloud, or
  similar. Analytics MUST be first-party or self-hosted (e.g., Plausible, Umami,
  Aptabase, self-hosted).
- **C2.5** IP addresses MUST be stripped or dropped at ingestion; they are
  quasi-identifiers.
- **C2.6** The full telemetry schema MUST be **published** to users.
- **C2.7** **Counting your own infrastructure is allowed.** Downloads (CDN logs),
  billing events (payment processor), and license validations are operational data
  the project legitimately owns — provided they are counted in aggregate and not
  joined back to a person or their content.
- **C2.8** A stable install/device ID used for *licensing* or a *local* feature
  (e.g., a cancel reminder) MUST stay on-device or with the payment processor only.
  It MUST NOT enter any telemetry stream.

## 3. AI & Third-Party Processing

- **C3.1** **BYOK MUST always be available** — the user can supply their own key and
  send content straight to their chosen provider.
- **C3.2** A **fully local model option** (e.g., Ollama / LM Studio) MUST be supported
  wherever technically feasible.
- **C3.3** An NC-750-hosted relay is permitted **only** if it is stateless and
  content-free by design: it forwards the request and retains no content, no logs of
  bodies, and strips IP. Its source SHOULD be open for auditability.
- **C3.4** Any default hosted processing MUST be backed by a Data Processing Agreement
  with the upstream provider, with **no-training** and **bounded (ideally zero)
  retention** of inputs confirmed in writing, before it ships.
- **C3.5** Content Security Policy MUST pin `connect-src` to the known endpoints; a
  permissive `https:` clause is a temporary measure only, never the shipped default.

## 4. Identity & Accounts

- **C4.1** The product MUST be fully usable **without creating an account**.
- **C4.2** If recurring billing exists, the billing identity MUST live with the
  **payment processor**, not inside the app. The app validates a license/key; it does
  not hold user accounts. Copy MUST say this honestly ("no account in the app; your
  subscription is managed by our payment processor").
- **C4.3** Secrets (API keys, tokens) MUST be stored in the OS-native credential store
  on desktop; never in plaintext on disk.

## 5. Monetization & Honesty

- **C5.1** **No dark patterns.** No fake urgency, no hidden cancellation, no
  manipulative defaults, no confirm-shaming.
- **C5.2** Where a product's value is time-bounded (e.g., a job hunt), the product
  SHOULD actively help the user **stop paying when done** (e.g., a local cancel
  reminder). Honesty here is treated as an acquisition strategy, not a loss.
- **C5.3** Paid tiers MUST gate **additional features**, not artificially cripple the
  core. In particular, a tier MUST NOT throttle something the user already pays for
  out of their own pocket (e.g., BYOK inference depth).
- **C5.4** Free tiers MUST be honestly labeled (free *forever* vs *trial*) and MUST be
  genuinely functional, not bait.
- **C5.5** Marketing claims MUST be **literally true**. No absolute ("nothing ever
  leaves your device") that the implementation contradicts. State the per-path truth.

## 6. Organizational / Channel Sales

- **C6.1** When a product is sold to an organization that distributes it to individuals
  (coaches, schools, employers), the **end-user experience and privacy MUST be
  identical** to the direct consumer version.
- **C6.2** The organizational buyer MAY see **seat utilization** (e.g., activations).
  The buyer MUST NEVER see an individual's content, persona, or results. This boundary
  is the line between a channel and surveillance; crossing it forfeits the brand.

## 7. Claims & Terminology Discipline

- **C7.1** Cryptographic terms of art ("zero-knowledge", "end-to-end encrypted",
  "anonymous") MUST NOT be used unless the property is literally implemented.
- **C7.2** Documentation MUST match the shipped reality. If an AI-generated or
  aspirational claim (e.g., "open source") is not yet true, it MUST NOT appear in
  user-facing copy.
- **C7.3** The product SHOULD over-disclose: publish what is sent, where, and why.
  Transparency is a brand asset, not a liability.
- **C7.4 (Honesty is presentational, not substantive — scope boundary).** The
  "claims literally true" discipline governs what a product asserts about **its own behaviour
  and data flow** — what it does, where data goes, what it stores. It does **not** make the
  product a validator of the *truth of user-supplied data*: a product MUST honestly present
  the real values it computed from its input, but is **not** required to certify that the
  input itself is true, and MUST NOT imply that it does. (A user who enters false data will
  honestly see that false data, or an analysis of it, reflected back.) This is the single
  canonical statement of the boundary; other documents (e.g. `VISUAL_IDENTITY.md` P5) point
  here rather than restating it. **Exception:** a product whose *stated purpose* is
  verification or fact-checking takes substantive truth back into scope and MUST meet it for
  the claims it makes about that function.
- **C7.5 (Selective ecosystem — informational).** NC-750 MAY decline to build a product
  whose nature is contrary to this ethos (e.g. one that cannot exist without ambient
  anticipation or attention-harvesting). The decision criteria are **not yet defined** and
  MUST NOT be treated as settled policy; this clause only records that refusal is a
  legitimate option, not an obligation to ship anything technically possible.

## 8. Visual & Naming Surface

- **C8.1** Products MUST follow the serialization architecture (`NODE/UNIT/CORE-XX`)
  and use the Lab design system per `lab/DESIGN.md`.
- **C8.2** The `0x00` mark certifies a zero-person-tracking environment; it MUST NOT be
  applied to any surface that violates Sections 1–2.
- **C8.3** Accessibility: WCAG 2.1 AA minimum, keyboard navigable, `prefers-reduced-motion`
  respected.

---

## Compliance checklist (run before shipping or branding anything)

- [ ] Local-only path offered wherever feasible; data destinations disclosed where not (C1.3)
- [ ] Plain-words disclosure of what is sent and where (C1.4, C7.3)
- [ ] User data never sold; on NC-750 servers or used for training only under the C1.6 fallback — minimized, opt-in, published (C1.1–C1.2, C1.6)
- [ ] Telemetry (if any) is opt-in, anonymous, aggregate, self-hosted, schema published (C2)
- [ ] No persistent ID or IP in telemetry; license ID stays out of telemetry (C2.3, C2.5, C2.8)
- [ ] BYOK + local model available; relay (if any) is no-log + DPA + no-train confirmed (C3)
- [ ] Usable with no in-app account; secrets in OS keystore (C4)
- [ ] No dark patterns; features gated, core not crippled; claims literally true (C5)
- [ ] Org buyers see seats, never content (C6)
- [ ] No misused crypto terms; docs match reality; honesty scoped to own behaviour, not user-data trueness (C7)
- [ ] Serialization, Lab system, `0x00`, WCAG AA (C8)
