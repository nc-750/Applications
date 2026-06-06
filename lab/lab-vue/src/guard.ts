// Runtime guard: lab-vue ships NO CSS. The consumer must import the Lab
// stylesheet (lab.css) exactly once at the app root. We verify it is loaded by
// probing the `--nc-lab` sentinel (value "750", a nod to NC-750) defined in
// lab.tokens.css. If it is missing, fail LOUD: console error + a full-screen
// banner + a thrown error. The banner is inline-styled (no class) because the
// stylesheet is precisely what is missing.

let checked = false;

/** Verify lab.css is loaded; fail loud if not. Idempotent; safe on SSR. */
export function assertLabCss(): void {
    if (checked) return;
    if (typeof document === "undefined") return; // non-DOM (SSR) — skip
    checked = true;

    const sentinel = getComputedStyle(document.documentElement)
        .getPropertyValue("--nc-lab")
        .trim();
    if (sentinel === "750") return;

    const msg =
        "[lab-vue] Lab CSS not loaded. Import the Lab stylesheet (lab.css) " +
        "exactly once at your app root before using lab-vue components.";

    // eslint-disable-next-line no-console
    console.error(msg);

    if (document.body) {
        const banner = document.createElement("div");
        banner.setAttribute("data-lab-error", "");
        banner.textContent = msg;
        banner.style.cssText =
            "position:fixed;inset:0;z-index:2147483647;display:flex;" +
            "align-items:center;justify-content:center;text-align:center;" +
            "padding:24px;background:#D13B3B;color:#fff;" +
            "font:600 14px/1.6 system-ui,sans-serif;";
        document.body.appendChild(banner);
    }

    throw new Error(msg);
}

/** Optional Vue plugin: `app.use(Lab)` runs the check after first paint. */
export const Lab = {
    install(): void {
        if (typeof window !== "undefined") {
            window.requestAnimationFrame(() => assertLabCss());
        }
    },
};

// Auto-run on import (deferred to after first paint) so the check fires even if
// the consumer never calls `app.use(Lab)`.
if (typeof window !== "undefined") {
    window.requestAnimationFrame(() => assertLabCss());
}
