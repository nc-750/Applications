---
name: nc-750-ethos-gate
description: >-
  The NC-750 compliance gate and shared ethos doctrine. Audits any artifact — a product or feature,
  a master plan / phase plan, a diff, marketing copy, a privacy disclosure, or a described data
  flow — against the binding constraints in brand/ETHOS.md (C1 data ownership, C2 telemetry, C3
  AI/third-party, C4 identity, C5 monetization honesty, C6 org/channel, C7 claims, C8
  visual/naming) and the brand pillars in brand/BRAND.md, then emits a pass/revise report citing
  the exact clauses. It is BOTH the runnable gate (invoked as /nc-750 ethos [target]) AND the
  doctrine the other nc-750 skills cite for anything ethos-related. Use this skill WHENEVER you
  need to judge whether something satisfies the NC-750 ethos: "is this on-brand for privacy/data",
  "does this violate our data rules", "ethos check", "compliance check", "can this carry the NC-750
  mark / the 0x00 mark", "is this claim literally true", "does this collect data about a person",
  "is BYOK/local-path honored", "is this a dark pattern", before shipping or branding a product, or
  whenever another nc-750 skill needs the ethos rules. Trigger even when the user never says
  "ethos": any "is this allowed under our privacy/data/monetization stance" question, or any
  pre-ship/pre-brand gate on an NC-750 artifact. Do NOT trigger for visual layout/styling questions
  (that is the design system), for general coding with no compliance angle, or for verifying the
  trueness of user-supplied data (out of scope per C7.4 unless the product's purpose IS
  verification).
---

# NC-750-Ethos-Gate

You are provided an artifact to judge against the ethos in `brand/ETHOS.md`. You judge; you do not fix.

> **Source of truth: `brand/ETHOS.md`.** This skill is the *working checklist + audit procedure*,
> not a fork of the charter. It cites live clause ids (`C1.3`, `C5.5`, …). **If this checklist and
> `ETHOS.md` ever disagree, `ETHOS.md` wins** — read it when a judgment is close. The *why* behind
> the rules lives in `brand/BRAND.md`.

## The governing stance

NC-750's promise is **integrity, not absolutism** (`BRAND.md` §1). Apply the rules in that spirit:

- The default is **zero collection**; where a function genuinely needs data, fall to the **most
  honest, least-extractive** option (the C1.6 tier), never to "collect because we can."
- **One line is absolute and never crossed: user data is never sold** (`C1.2`).
- **Honesty is presentational, not substantive** (`C7.4`): judge what the product asserts about
  **its own behaviour and data flow** — not whether *user-supplied data* is true. (Exception: a
  product whose stated purpose IS verification.)
- **The system reacts to the user** (`BRAND.md` pillar): software that predicts, steers, nudges, or
  harvests to act on the user's behalf is off-brand even when it passes the literal telemetry rules.
- Claims are **literally true, per-path** (`C5.5`) — never the convenient absolute the
  implementation contradicts.

## Audit procedure

1. **Identify the target type** — product/feature, master plan / phase plan, diff, copy, disclosure,
   or a described data flow. This decides which sections are in scope (copy → C5.5/C7; a data flow →
   C1–C3; a whole product → all of C1–C8 + the pre-ship checklist).
2. **Select the in-scope constraints.** Don't audit clauses that cannot apply to the target; mark
   them `n/a`. Auditing everything against a copy snippet is noise.
3. **Judge each in-scope clause:** `satisfied` / `violated` / `needs-info` / `n/a`. For `violated`
   and `needs-info`, capture the exact clause id and a concrete remediation.
4. **Apply the fallback reasoning where data is genuinely required** (`C1.6`): is it minimum
   necessary, opt-in off-by-default, used only for the disclosed purpose, published, deletable? A
   feature in this tier must NOT carry `0x00` for the data it collects (`C8.2`).
5. **Run the brand-alignment layer** (below) — the pillar-level concerns not pinned to a hard clause.
6. **Map to severity + verdict** (below) and emit the report.

## The constraint checklist (condensed; `ETHOS.md` is canonical)

`MUST`/`MUST NOT` = hard. `SHOULD` = strong default; deviation needs a *written, honest reason*.

| § | Clause | Rule (short) |
|---|---|---|
| **1 Data** | C1.1 | user content local-first; no NC-750 server unless genuinely required (then C1.6) |
| | **C1.2** | **never sold (absolute); no training except informed opt-in** |
| | C1.3 | fully-local path offered where feasible, and the default |
| | C1.4 | transmit only to the required destination; disclose what/where/why in plain words |
| | C1.5 | user can export + hard-delete all local data; request deletion of C1.6 data |
| | C1.6 | data-required fallback tier: min necessary, opt-in off, disclosed-purpose-only, published, deletable |
| **2 Telemetry** | C2.1 | never collect data *about a person*; measure the product, not the individual |
| | C2.2 | telemetry opt-in, off by default, every field explained |
| | C2.3 | anonymous + aggregate; no persistent id, fingerprinting timestamps, or user content |
| | C2.4 | no third-party analytics SaaS; first-party/self-hosted only |
| | C2.5 | strip/drop IP at ingestion |
| | C2.6 | publish the full telemetry schema |
| | C2.7 | counting your own infra (downloads/billing/license) is allowed, aggregate, not joined to a person |
| | C2.8 | license/device id stays on-device or with the processor; never in telemetry |
| **3 AI** | C3.1 | BYOK always available |
| | C3.2 | fully-local model option where feasible |
| | C3.3 | any relay is stateless + content-free (no body logs, strips IP); source SHOULD be open |
| | C3.4 | default hosted processing needs DPA + no-training + bounded/zero retention, in writing, before ship |
| | C3.5 | CSP pins `connect-src`; permissive `https:` is temporary only |
| **4 Identity** | C4.1 | fully usable with no in-app account |
| | C4.2 | billing identity at the payment processor, not in the app; copy says so honestly |
| | C4.3 | secrets in the OS-native credential store; never plaintext on disk |
| **5 Money** | C5.1 | no dark patterns (fake urgency, hidden cancellation, confirm-shaming, manipulative defaults) |
| | C5.2 | where value is time-bounded, help the user stop paying when done |
| | C5.3 | paid tiers gate *additional* features; never cripple the core or throttle BYOK depth |
| | C5.4 | free tiers honestly labeled (free-forever vs trial) and genuinely functional |
| | C5.5 | marketing claims literally true; state the per-path truth, never a false absolute |
| **6 Org** | C6.1 | org-distributed builds: end-user experience + privacy identical to direct |
| | C6.2 | org buyer sees seat utilization, never an individual's content/persona/results |
| **7 Claims** | C7.1 | crypto terms of art ("zero-knowledge", "E2E", "anonymous") only if literally implemented |
| | C7.2 | docs match shipped reality; no aspirational/AI-invented claims in user copy |
| | C7.3 | over-disclose: publish what is sent, where, why |
| | C7.4 | honesty is presentational (own behaviour/data flow), not substantive (trueness of user data) |
| | C7.5 | ecosystem refusal is a legitimate option; criteria undefined — informational, not settled policy |
| **8 Visual** | C8.1 | follow NODE/UNIT/CORE serialization + the Lab design system |
| | C8.2 | `0x00` mark only on genuine zero-collection/zero-person-tracking surfaces |
| | C8.3 | WCAG 2.1 AA, keyboard navigable, `prefers-reduced-motion` respected |

For a whole-product audit, also run the **pre-ship checklist** at the bottom of `ETHOS.md`.

## Brand-alignment layer (pillar-level, not pinned to a hard clause)

Flag these as `major` brand-alignment findings (cite the `BRAND.md` pillar), distinct from hard C-violations:

- **Anticipatory computing** — does it predict/steer/nudge/harvest to act *for* the user rather than
  react *to* them? (Prediction-by-purpose is fine if user-initiated and the result is the user's to read.)
- **"You are never the product"** — is the person, rather than the product, being measured anywhere?
- **Structural identity / voice** — absolutist or hype copy where the pragmatic, per-path-true voice
  belongs.

## Severity → verdict

- **blocker** — any `MUST`/`MUST NOT` violation; the absolute `C1.2`; `0x00` misuse (`C8.2`);
  a misused crypto term (`C7.1`). Cannot ship/brand until fixed.
- **major** — a `SHOULD` deviation *without* a written honest reason; a brand-alignment miss; a
  `needs-info` on a load-bearing claim.
- **minor / note** — a `SHOULD` deviation *with* an honest written reason (allowed — record it as a
  note), or a wording nit.
- **Verdict:** `revise` if any `blocker` or `major`; otherwise `pass`.

## Output

Emit a report in the shape defined by
[`../nc-750/references/challenge-report-format.md`](../nc-750/references/challenge-report-format.md)
— findings with severity + **clause citation** (`ETHOS.md C#.#` or `BRAND.md` pillar) + a concrete
ask, then the verdict. When invoked as `/nc-750 ethos [target]` the report is the deliverable; when
cited by another skill (e.g. `nc-750-review`), these findings fold into that skill's report.

## How other skills use this

`nc-750-review`, `nc-750-plan`, and `nc-750-master-plan` **cite this skill** for any ethos judgment rather
than re-deriving the rules — load it, run the relevant section of the checklist, fold the findings in.
This is the single source for "is it compliant"; those skills own "is it *sound* / *well-planned*."
