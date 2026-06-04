import { http, HttpResponse } from "msw";

const LS_BASE = "https://api.lemonsqueezy.com/v1";

// ── Response factories ────────────────────────────────────────────────────────

export function createActivateSuccess(instanceId = "inst_abc123") {
  return HttpResponse.json({
    activated: true,
    license_key: { key: "ls_xxxx-12345678" },
    instance: { id: instanceId },
    meta: {},
  });
}

export function createActivateFailure(status: number, detail: string) {
  return HttpResponse.json(
    { errors: [{ detail, status: String(status) }] },
    { status }
  );
}

export function createValidateResponse(valid: boolean) {
  return HttpResponse.json({
    valid,
    license_key: { key: "ls_xxxx-12345678", status: valid ? "active" : "expired" },
    instance: { id: "inst_abc123" },
    meta: {},
  });
}

export function createDeactivateSuccess() {
  return HttpResponse.json({
    deactivated: true,
    meta: {},
  });
}

// ── MSW handlers ──────────────────────────────────────────────────────────────

export interface LSServerOptions {
  /** Activation response: "success" | { status: number; detail: string } */
  activate?: "success" | { status: number; detail: string };
  /** Validation response: true = valid, false = expired/revoked */
  validate?: boolean;
  /** Deactivation response: true = success */
  deactivate?: boolean;
}

/**
 * Creates MSW handlers for the Lemon Squeezy license API. Both the Tauri backend
 * (via Rust invoke → reqwest) and the PWA (direct fetch) hit the same endpoints,
 * so a single set of handlers covers both paths.
 */
export function createLSHandlers(opts: LSServerOptions = {}) {
  return [
    http.post(`${LS_BASE}/licenses/activate`, async () => {
      if (opts.activate === "success" || opts.activate === undefined) {
        return createActivateSuccess();
      }
      return createActivateFailure(opts.activate.status, opts.activate.detail);
    }),

    http.post(`${LS_BASE}/licenses/validate`, async () => {
      return createValidateResponse(opts.validate ?? true);
    }),

    http.post(`${LS_BASE}/licenses/deactivate`, async () => {
      if (opts.deactivate === false) {
        return HttpResponse.json({ errors: [{ detail: "Not found" }] }, { status: 404 });
      }
      return createDeactivateSuccess();
    }),
  ];
}
