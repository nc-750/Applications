# Mirror (NODE-0M) — Pricing & Tiers

> The plan structure, what each tier includes, and **why each lever exists**.
> Governed by `brand/ETHOS.md` §5 (monetization) and §6 (channel). Couples with
> `mirror/LICENSING.md` (enforcement) and `mirror/MEASUREMENT.md` (validation).
>
> **Pricing numbers below are hypotheses, not commitments** — validate willingness
> to pay via Approach E (user + coach interviews) before locking them in.

## The one rule that shapes everything

**Inference cost is a *route* lever. Paid tiers are a *feature* lever. Never gate one
with the other.** We do **not** throttle interview depth — a user who pays for their
own tokens (BYOK) gets the full interview. Paid plans sell *additional capabilities*,
not a de-crippled core (ETHOS C5.3).

## The tiers

### Free — "a first read, instantly"
- Upload **one file** (CV, LinkedIn export, or notes), capped size.
- Get a **basic persona** from that file, plus the full **Insight** and **Profile**
  documents (the renderers are deterministic — rendering costs us nothing).
- **No interview** (that's the deep, costly part).
- Runs on Mirror's **hosted relay** — zero setup, no account, no card.
- *Our cost:* one bounded LLM call per persona. Predictable, capped.

### Job Seeker — "the full interview, plus tools for the hunt" (recurring)
- **Full AI interview** — conversational, deep, **no question limit**.
- Rich persona → richer Insight + Profile.
- **Transversal features:** mock interview practice, public-profile theme editor,
  multiple saved personas.
- Runs on the **hosted relay** (zero setup) **or** your **own key** (BYOK).
- **Recurring**, because value is concentrated during an active hunt and recurring
  revenue is what makes hosted inference + run-cost features sustainable.
- **Cancellation honesty (ETHOS C5.2):** cancel anytime, and the app shows a **local
  reminder** after a few months — *"Landed the role? You can cancel."* No dark patterns;
  this is an acquisition strategy, not a leak.

### BYOK — the escape valve (a route, not a separate purchase)
- Any user may supply their own API key (or run a local model). Content goes straight
  to their provider; **our relay is never involved**.
- A **Free** user with BYOK unlocks the **full interview** at their own cost — but
  **not** the Job Seeker transversal features (those are a subscription).
- A **Job Seeker** subscriber may *also* use BYOK (best margin for us: they fund the
  inference, we provide the features).

### Coach / Partner — for orgs that distribute to individuals (seats)
- Buys **seats** of the Job Seeker experience to assign to clients (coaches,
  outplacement firms, universities, bootcamps).
- The end-user experience and privacy are **identical** to direct Job Seeker (ETHOS C6.1).
- **Hard boundary (ETHOS C6.2):** the buyer sees **seat utilization** (activations),
  **never** a client's content, persona, or results. Crossing this line turns a channel
  into surveillance and forfeits the brand.
- Volume pricing, billed annually. Likely the **durable recurring backbone** (orgs renew;
  individual hunts are spiky).

## Entitlement matrix

| | Hosted relay (no setup) | BYOK (own key) | Local model |
|---|---|---|---|
| **Free** | 1 file · no interview · basic persona (our bounded cost) | Full interview core (their cost) · no transversal features | Same as BYOK, fully offline |
| **Job Seeker** | Full interview + all features, hosted (our cost, funded by sub) | Full interview + all features (their cost — our best margin) | Full interview + features, offline |
| **Coach** | Job Seeker per seat, hosted | Job Seeker per seat, BYOK | Job Seeker per seat, offline |

## Feature ledger — build-cost vs run-cost

Categorize every paid feature before shipping it. **Run-cost features on the hosted
relay only make sense under recurring revenue** — never behind a one-time fee (ETHOS C5.3).

| Feature | Type | Notes |
|---|---|---|
| Public-profile theme editor | **Build-cost** | Zero marginal cost — ideal paid feature (uses the Enclosure seed system) |
| Multiple saved personas | **Build-cost** | Storage only |
| Export formats / variations | **Build-cost** | Deterministic renderers |
| Full conversational interview | **Run-cost** | Core; hosted = us (sub-funded), BYOK = user |
| Mock interview practice | **Run-cost** | Recurring sub covers it; consider a soft meter on hosted |
| Re-analysis / follow-up Q&A | **Run-cost** | Prefer BYOK-only or metered on hosted |

## Enforcement (see LICENSING.md)
- The hosted interview runs **through the relay**, which **validates the license
  server-side** before serving it. This makes the headline paid perk — zero-setup
  hosted interview — the one feature that **can't be bypassed by patching the client**.
- BYOK-routed transversal features remain client-gated (bypassable); accepted, non-DRM.
- Subscriptions and seats are managed by **Lemon Squeezy**; the app holds **no account**,
  only validates a key (ETHOS C4.2).

## What we explicitly do NOT do
- ❌ Gate interview **depth** (the old 2–3 vs 5–8 model is retired).
- ❌ Charge a one-time fee for unmetered, inference-heavy features.
- ❌ Let an org buyer see client content.
- ❌ Hide cancellation or milk silent churn.

## Pricing hypotheses (validate before committing)
| Tier | Hypothesis | Model |
|---|---|---|
| Free | $0 | — |
| Job Seeker | ~$9–15 / mo | recurring, cancel anytime |
| Coach | per-seat, annual, volume | quote / channel |

## Open items
- [ ] Validate prices + recurring-vs-onetime appetite via Approach E.
- [ ] Decide the Free file-size cap and the Job Seeker hosted-inference fair-use ceiling.
- [ ] Build the local cancel-reminder (no server).
- [ ] Real Lemon Squeezy subscription + Coach products/URLs (replace `REPLACE_ME`).
- [ ] Define exactly which transversal features ship at Job Seeker launch.
