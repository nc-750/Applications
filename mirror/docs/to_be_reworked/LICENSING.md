# Mirror Pro — License Activation Design (sketch)

> Status: design sketch for discussion. Not yet implemented.
> Goal: cap license-key sharing **without** betraying the NC-750 privacy pillar
> (no accounts, no user-data backend, no tracking).

## The problem

Mirror is local-first, server-less, and BYOK. Pro is a client-side feature gate
(question depth, richer synthesis). Two leaks make the current model
unenforceable:

1. **Client-side gate.** The PWA ships its JavaScript to every browser, so the
   Pro check is inspectable/patchable regardless of whether the repo is public.
   The desktop (Tauri) binary is harder but not immune.
2. **Unlimited license key.** Today a key validates nothing and has no
   activation ceiling — one purchase can be shared infinitely. This is the
   dominant piracy vector, and it is independent of source visibility.

**Design stance:** this is not DRM. The determined will bypass a local gate; that
is acceptable. The goal is to make *casual key-sharing inconvenient and capped*
while keeping honest users frictionless — and to do it without a data backend.

## The key insight (privacy reconciliation)

"Mirror has no server" is a promise about **your data** — your CV, interview, and
outputs never touch a Mirror-owned backend. A **license check is not a data
backend**: it sees a license key and an opaque install ID, never your career
content. These are different claims and the copy must say so:

> Your data never leaves your device. The only thing Mirror ever sends about
> *you* is what you choose to send to your AI provider. A Pro license is verified
> with our payment processor (Lemon Squeezy) — that check sees your license key,
> nothing else.

## Recommended approach: Lemon Squeezy License API

You already plan to sell through Lemon Squeezy, and LS ships a **License API**
that does exactly this — no server for you to build or host:

- `POST /v1/licenses/activate` — `{ license_key, instance_name }` → returns an
  `instance_id` if under the activation limit; refuses if over.
- `POST /v1/licenses/validate` — `{ license_key, instance_id }` → confirms the
  key is still valid (not refunded/deactivated/expired).
- `POST /v1/licenses/deactivate` — frees a slot so a user can move devices.

The **activation limit is configured per product in the LS dashboard** (e.g. 3–5
instances per key). That single setting is the "impose a limit" lever — enforced
by the same vendor already taking the payment, with zero infrastructure on your
side.

### Why this fits NC-750

- **No backend to run.** Preserves the "no server" architecture for everything
  that matters.
- **Content-free.** LS sees only `{license_key, instance_name, IP, timestamp}`.
  Never the interview, the persona JSON, or any PII beyond what the purchase
  already involved.
- **Vendor already trusted** with the transaction; no *new* third party in the
  privacy story.

## Activation request contract (enforce in code review)

The activation/validation call MUST contain only:

- `license_key` — the purchased key.
- `instance_name` — an **opaque random UUID generated once per install**
  (Tauri: app-data file; PWA: IndexedDB). **Not** a hardware fingerprint — it
  counts installs, not people, and is not cross-app trackable.

It MUST NEVER contain: interview text, persona JSON, file uploads, the AI API
key, model/provider choice, email, or any user-authored content.

## Offline grace (don't hold data hostage)

Mirror must work on a plane and must never lock a user out of their own data.

1. On successful `validate`, cache a **signed result with a TTL** (suggest
   14–30 days) in local storage.
2. While the cache is fresh, Pro works fully offline — no network call.
3. On expiry, re-validate when next online. If offline, **extend grace** rather
   than locking immediately.
4. If validation ultimately fails (refund, chargeback, deactivation): lock
   **Pro-only** features. **Free tier and all existing local data, exports, and
   the persona remain fully usable.** Never delete or gate the user's own work.

## Optional hardening: offline signature root

For airplane-mode first launches before any successful activation, the key can
*also* be an Ed25519-signed token (payload: `{ product, tier, issued_at }`,
public key bundled in the app). This lets the app trust a freshly entered key
offline until it can confirm with LS. It does **not** enforce the device cap
(only the server count can) — it only prevents trivially forged keys. Treat as a
nice-to-have, not the primary mechanism.

## Threat model (state it honestly)

| Vector | Mitigated? |
|--------|-----------|
| Forged / random fake key | Yes — LS validate rejects it |
| One key shared across many devices | Yes — capped by LS activation limit |
| Refund-then-keep-using | Yes — next validation fails after grace |
| Determined user patches the local gate (esp. PWA JS) | **No — accepted.** Out of scope for a non-DRM model. |

Price and UX so that the ~honest majority never hits friction and never needs to
bypass; accept leakage at the determined tail.

## Implementation checklist

- [ ] Configure activation limit on the Mirror Pro product in Lemon Squeezy.
- [ ] `src/lib/license.ts` — `activate()`, `validate()`, `deactivate()`,
      plus the local install-UUID and the signed-grace cache.
- [ ] Wire the Settings → Pro panel: enter key → activate → show
      "Pro · N of M devices" + a "Deactivate this device" button.
- [ ] Gate Pro features off the cached validation state, not a raw boolean.
- [ ] CSP: add `https://api.lemonsqueezy.com` to `connect-src` in both
      `tauri.conf.json` and the PWA `index.html` (currently a permissive
      `https:` covers it, but pin it explicitly).
- [ ] Decide the cap number (suggest 3–5) and the grace TTL (suggest 14–30 days).

## Copy that must change when the cap ships

These currently assert "unlimited" and will become false:

- `mirror/website/src/pages/index.astro` (~line 254–260) — the
  "One license to rule them all … valid for all devices. Unlimited." cell.
- `mirror/website/src/content/docs/faq.md` — "What does the Pro license cost?"
  ("activates on multiple devices … within reason") should state the real cap.

Replace "Unlimited" with the honest number, e.g. *"One license, up to N of your
own devices."*
