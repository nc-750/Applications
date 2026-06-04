# Mirror (NODE-0M) — Measurement Plan

> How Mirror gets the business visibility a real product needs **without** tracking
> anyone. Governed by `brand/ETHOS.md` §2. Committed posture: **A + E**
> (infra-only metrics + direct human contact). No client event telemetry ships yet.

## The principle

**Measure our own infrastructure, not the user's device.** Most of what a real
business needs — acquisition, conversion, retention, churn — already crosses systems
we operate (the download host, the inference relay, the payment processor). We count
those, in aggregate, never joined to a person. We add *zero* client-side tracking.
The one thing infra can't see — *why* a free user drops — we get by **asking people**,
not by watching them.

---

## Approach A — Infra-only metrics (ships now)

We read aggregate counts from the three systems we already run. **None of this adds
tracking to the app.**

| Source | Answers | Collected | Never collected |
|--------|---------|-----------|-----------------|
| **Download / binary host (CDN logs)** | Installs, platform/OS split, coarse geography, download trend | Aggregate request counts | No per-user profile; IP dropped/aggregated at edge |
| **Inference relay** | Free personas generated (volume), hosted-interview volume, error/latency rates | Counts + operational health | **No prompt/response content, ever**; no per-user history; no stable ID |
| **Lemon Squeezy (payments + license API)** | Checkouts, active subs, **plan switches**, churn timing, MRR, refunds, license activations, Coach seats used | Billing + license aggregates | We don't pull customer PII into our own analytics; LS holds the billing identity, not Mirror |

### Funnel questions → where each is answered

| Question | Source (Approach A) |
|----------|--------------------|
| How many installs? Which platforms? | CDN logs |
| Do installs become a first persona? | Relay Free-call volume vs installs |
| Free → Job Seeker conversion? | Lemon Squeezy |
| Retention / repeat hunts? | Lemon Squeezy subscriptions |
| Does the cancel-reminder work (healthy voluntary churn)? | Lemon Squeezy churn timing |
| Do Coach seats actually get used? | License activations per Coach order |
| Hosted inference cost vs revenue? | Relay volume × provider price, vs LS MRR |

### Hard rules for Approach A (from ETHOS §2.7, §3.3)
- The relay MUST be **no-log for bodies** and strip IP. It counts requests; it does not
  record what's in them.
- CDN/edge MUST drop or aggregate IP; no per-visitor profiles.
- Aggregates only — never reconstruct a per-person timeline from infra logs.

---

## Approach E — Talk to humans (ships now, ongoing)

The n=1 problem (the product was first built for its author) is **qualitative**, and
qualitative beats dashboards at this stage. This is also 100% brand-safe.

- **Opt-in in-app micro-survey at the drop point.** A single, dismissible, optional
  prompt — e.g., after a Free persona renders: *"Want to tell us what's missing? (optional)"*
  → one free-text box. It MUST be opt-in, MUST send no content automatically, and SHOULD
  post only the user's typed answer to a first-party endpoint (or open a mailto). No
  identifiers attached.
- **15 user interviews** with real job-seekers who are *not* the founder. Recruit via
  the download page, communities, or the survey opt-in. Goal: does the Free file-only
  persona create the "I want the deep version" pull? Where does trust break?
- **5 coach / career-center conversations.** Validates the Coach tier *and* the wholesale
  channel in an afternoon each. Ask what they'd pay per seat and what reporting they'd
  expect — then hold the C6.2 line (seats yes, content never).
- **Watch the support inbox and refund reasons** as a free, honest signal stream.

---

## What we deliberately do NOT do (yet)

- ❌ No client event telemetry (no `interview_completed` beacons) in v1.
- ❌ No persistent install/analytics ID. The licensing UUID stays out of any metrics
  stream (ETHOS §2.8).
- ❌ No third-party analytics SaaS anywhere — site, PWA, or desktop (ETHOS §2.4).
- ❌ No IP logging in the relay or telemetry path.

## When to graduate to Approach C (opt-in events)

Add self-hosted, opt-in, anonymous event telemetry **only when** a specific question
can't be answered by A+E — most likely: *"where exactly in the in-app funnel do BYOK
and local users drop?"* (those users never touch our servers).

If/when that happens, it MUST satisfy ETHOS §2 in full:
- Off by default, explicit consent, published schema.
- **Stateless events or per-session ephemeral ID only** — no persistent ID.
- Self-hosted: **Aptabase** (built for Tauri/desktop, privacy-first) for the app;
  **Umami / Plausible** (cookieless, self-hostable) for the website/PWA.
- No content, no IP, coarse buckets, k-anonymity where a dimension could narrow to a person.

Until that trigger fires, A+E is the committed plan.

---

## Open items / dependencies
- [ ] Confirm the binary host's log retention + IP handling once the download host is
      chosen (replaces the removed GitHub releases — see `website/src/config.ts` `desktopUrl`).
- [ ] Ensure the relay spec bakes in no-body-logging + IP-strip from day one
      (couples with `mirror/LICENSING.md` — the relay is also the license checkpoint).
- [ ] Confirm Nebius DPA + no-training/bounded-retention before the hosted relay serves
      real users (ETHOS §3.4) — outstanding from the provider review.
- [ ] Build the opt-in micro-survey endpoint (first-party, no identifiers).
- [ ] Add a plain-words "What we measure" section to the site, mirroring `privacy.md`.
