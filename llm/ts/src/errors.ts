import { LLMError } from "./types";
import type { ProviderKind } from "./types";

// ── Key redaction ──────────────────────────────────────────────────────────

const KEY_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9_-]{20,}/g,        // OpenAI / Anthropic standard keys
  /sk-ant-[a-zA-Z0-9_-]{20,}/g,     // Anthropic admin keys
  /x-api-key[:=]\s*\S+/gi,          // API key in headers or params
];

/**
 * Strips API key patterns from a string, replacing them with `[REDACTED]`.
 *
 * Call this before logging any text that might contain credentials — for
 * example, error messages returned from vendor SDKs, or raw HTTP responses.
 *
 * @example
 * ```ts
 * sanitize("Auth failed: sk-abc123def456"); // "Auth failed: [REDACTED]"
 * ```
 */
export function sanitize(text: string): string {
  let s = text;
  for (const re of KEY_PATTERNS) {
    s = s.replace(re, "[REDACTED]");
  }
  return s;
}

// ── Error normalization ────────────────────────────────────────────────────

/**
 * Maps a vendor SDK error to a normalized {@link LLMError}.
 *
 * Each vendor throws errors with different shapes — OpenAI uses `APIError`
 * with a `status` field, Anthropic uses its own `APIError` shape, and
 * cancellations produce `DOMException` (AbortError). This function inspects
 * the error shape and produces a single, predictable {@link LLMError}.
 *
 * The error message is sanitized to remove any API key patterns before
 * it reaches the caller or any log output.
 *
 * @example
 * ```ts
 * try {
 *   await vendorSDK.create(...);
 * } catch (err) {
 *   return Err(normalizeError(err, "openai"));
 * }
 * ```
 */
export function normalizeError(error: unknown, provider: ProviderKind): LLMError {
  // AbortError — request was cancelled
  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return new LLMError("Request was cancelled", provider, { isAborted: true });
  }

  // OpenAI SDK errors — have a `status` field
  if (
    error !== null &&
    typeof error === "object" &&
    "status" in error
  ) {
    const e = error as { status: number; message?: string; code?: string };
    return new LLMError(
      sanitize(e.message ?? "OpenAI API error"),
      provider,
      { statusCode: e.status, cause: error },
    );
  }

  // Anthropic SDK errors — have a `status` field too, but also a `type` field
  if (
    error !== null &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error
  ) {
    const e = error as { type: string; message: string; status?: number };
    return new LLMError(
      sanitize(e.message),
      provider,
      { statusCode: e.status, cause: error },
    );
  }

  // Generic Error
  if (error instanceof Error) {
    return new LLMError(
      sanitize(error.message),
      provider,
      { cause: error },
    );
  }

  // Unknown — best-effort stringification
  return new LLMError(
    sanitize(String(error ?? "Unknown error")),
    provider,
    { cause: error },
  );
}
