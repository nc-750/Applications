// Mirrors css/enclosure.tokens.css; update matching row + run `npm run verify`.
//
// Declarative color-token derivation for the Enclosure design system.
// Every color token in tokens.css is reproduced here as one TokenSpec row,
// per theme (LIGHT mirrors lines ~11-156, DARK mirrors the [data-theme="dark"]
// block ~330-492). Offsets/clamps replicate the calc() chains exactly.
//
// Non-color tokens (gradients, shadows, typography, spacing, radii, motion)
// are NOT derived — they pass through verbatim during flatten.

export interface HSL {
    h: number;
    s: number;
    l: number;
}

/** A single resolved color token: var name → { h, s, l, alpha }. */
export interface DerivedColor {
    h: number;
    s: number;
    l: number;
    a?: number; // 0..1 alpha; undefined = opaque
}

/** A derived theme: var name (e.g. "--nc-bg") → resolved color. */
export type DerivedTheme = Record<string, DerivedColor>;

type Chan = "seed" | "accent" | "fixed";

export interface TokenSpec {
    name: string; // CSS custom-property name, e.g. "--nc-bg"
    chan: Chan;
    // For seed/accent: offsets added to the channel value.
    // For fixed: hOff/sOff/lOff are the absolute h/s/l.
    hOff: number;
    sOff: number;
    lOff: number;
    lAbs?: number; // pinned absolute lightness (dark surface ramp / ink); overrides lOff
    sAbs?: number; // pinned absolute saturation (rare; e.g. dark accent-ink uses 100%)
    lMin?: number; // clamp() lower bound on L
    lMax?: number; // clamp() upper bound on L
    alpha?: number; // 0..1 → emit hsl(... / a)
}

export function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/** HSL → hex (e.g. {214,14,85} → "#d3d8de") */
export function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number): string => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/** Resolved color → CSS hsl() string. Modern space-separated syntax. */
export function hslToString(c: DerivedColor): string {
    const h = Math.round(c.h);
    const s = Math.round(c.s);
    const l = Math.round(c.l);
    if (c.a != null && c.a < 1) {
        return `hsl(${h} ${s}% ${l}% / ${c.a})`;
    }
    return `hsl(${h} ${s}% ${l}%)`;
}

function resolve(spec: TokenSpec, seed: HSL, accent: HSL): DerivedColor {
    let h: number;
    let s: number;
    let l: number;

    if (spec.chan === "fixed") {
        h = spec.hOff;
        s = spec.sOff;
        l = spec.lOff;
    } else {
        const base = spec.chan === "seed" ? seed : accent;
        h = base.h + spec.hOff;
        s = spec.sAbs != null ? spec.sAbs : base.s + spec.sOff;
        l = spec.lAbs != null ? spec.lAbs : base.l + spec.lOff;
    }

    if (spec.lMin != null || spec.lMax != null) {
        l = clamp(l, spec.lMin ?? 0, spec.lMax ?? 100);
    }
    // Hue wraps; saturation/lightness physically clamp to 0..100.
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100);
    l = clamp(l, 0, 100);

    const out: DerivedColor = { h, s, l };
    if (spec.alpha != null) out.a = spec.alpha;
    return out;
}

// ── LIGHT theme — mirrors tokens.css :root lines ~11-156 ──────────────────
export const LIGHT: TokenSpec[] = [
    // Surface ramp
    { name: "--nc-bg", chan: "seed", hOff: 0, sOff: 0, lOff: 0 },
    { name: "--nc-bg-sunken", chan: "seed", hOff: 0, sOff: 0, lOff: -5 },
    { name: "--nc-panel", chan: "seed", hOff: -4, sOff: 8, lOff: 13, lMin: 0, lMax: 98 },
    { name: "--nc-panel-2", chan: "seed", hOff: -2, sOff: 2, lOff: 8, lMin: 0, lMax: 98 },
    { name: "--nc-panel-3", chan: "seed", hOff: 0, sOff: 0, lOff: 3, lMin: 0, lMax: 98 },
    { name: "--nc-inset", chan: "seed", hOff: 0, sOff: -1, lOff: 5, lMin: 0, lMax: 98 },
    { name: "--nc-hover", chan: "seed", hOff: -2, sOff: 2, lOff: 5, lMin: 0, lMax: 98 },
    { name: "--nc-active", chan: "seed", hOff: -2, sOff: 2, lOff: 1, lMin: 0, lMax: 98 },
    // Console
    { name: "--nc-console", chan: "seed", hOff: 6, sOff: 2, lOff: -75, lMin: 5, lMax: 20 },
    { name: "--nc-console-2", chan: "seed", hOff: 6, sOff: 0, lOff: -70, lMin: 5, lMax: 25 },
    { name: "--nc-console-line", chan: "seed", hOff: 6, sOff: -2, lOff: -59, lMin: 10, lMax: 40 },
    // Ink
    { name: "--nc-ink", chan: "seed", hOff: 6, sOff: 6, lOff: -74, lMin: 5, lMax: 20 },
    { name: "--nc-ink-2", chan: "seed", hOff: 4, sOff: -3, lOff: -55, lMin: 10, lMax: 45 },
    { name: "--nc-ink-3", chan: "seed", hOff: 2, sOff: -5, lOff: -39, lMin: 15, lMax: 60 },
    { name: "--nc-ink-faint", chan: "seed", hOff: 2, sOff: -5, lOff: -25, lMin: 20, lMax: 75 },
    { name: "--nc-ink-invert", chan: "seed", hOff: -4, sOff: 4, lOff: 8, lMin: 88, lMax: 98 },
    { name: "--nc-ink-invert-2", chan: "seed", hOff: -2, sOff: -4, lOff: -23, lMin: 50, lMax: 75 },
    { name: "--nc-on-ink", chan: "seed", hOff: -4, sOff: 8, lOff: 13, lMin: 93, lMax: 100 },
    // Seams / lines
    { name: "--nc-line", chan: "seed", hOff: 0, sOff: 0, lOff: -12 },
    { name: "--nc-line-subtle", chan: "seed", hOff: 0, sOff: -1, lOff: -5 },
    { name: "--nc-line-strong", chan: "seed", hOff: 2, sOff: 2, lOff: -25 },
    { name: "--nc-line-ink", chan: "seed", hOff: 6, sOff: 6, lOff: -74, lMin: 5, lMax: 20 },
    { name: "--nc-seam-fill", chan: "seed", hOff: 0, sOff: 2, lOff: -24 },
    // Accent
    { name: "--nc-accent", chan: "accent", hOff: 0, sOff: 0, lOff: 0 },
    { name: "--nc-accent-hover", chan: "accent", hOff: 0, sOff: 0, lOff: 5 },
    { name: "--nc-accent-active", chan: "accent", hOff: -3, sOff: -8, lOff: -6 },
    { name: "--nc-accent-ink", chan: "accent", hOff: -1, sOff: -12, lOff: -15 },
    { name: "--nc-accent-subtle", chan: "accent", hOff: 0, sOff: 0, lOff: 0, alpha: 0.12 },
    { name: "--nc-on-accent", chan: "accent", hOff: 2, sOff: 0, lOff: 0, sAbs: 60, lAbs: 10 },
    // Semantic — fixed
    { name: "--nc-success", chan: "fixed", hOff: 150, sOff: 42, lOff: 36 },
    { name: "--nc-success-subtle", chan: "fixed", hOff: 150, sOff: 42, lOff: 36, alpha: 0.12 },
    { name: "--nc-warning", chan: "fixed", hOff: 38, sOff: 92, lOff: 45 },
    { name: "--nc-warning-subtle", chan: "fixed", hOff: 38, sOff: 92, lOff: 45, alpha: 0.14 },
    { name: "--nc-error", chan: "fixed", hOff: 4, sOff: 78, lOff: 50 },
    { name: "--nc-error-subtle", chan: "fixed", hOff: 4, sOff: 78, lOff: 50, alpha: 0.12 },
    { name: "--nc-on-error", chan: "fixed", hOff: 0, sOff: 0, lOff: 100 },
    { name: "--nc-info", chan: "fixed", hOff: 206, sOff: 64, lOff: 44 },
    { name: "--nc-info-subtle", chan: "fixed", hOff: 206, sOff: 64, lOff: 44, alpha: 0.12 },
];

// ── DARK theme — mirrors tokens.css [data-theme="dark"] ~330-492 ──────────
// Surface ramp + ink use PINNED absolute L (lAbs); H/S still seed-derived.
export const DARK: TokenSpec[] = [
    // Surface ramp
    { name: "--nc-bg", chan: "seed", hOff: 6, sOff: 0, lOff: 0, lAbs: 13 },
    { name: "--nc-bg-sunken", chan: "seed", hOff: 6, sOff: 2, lOff: 0, lAbs: 9 },
    { name: "--nc-panel", chan: "seed", hOff: 4, sOff: -2, lOff: 0, lAbs: 18 },
    { name: "--nc-panel-2", chan: "seed", hOff: 5, sOff: -2, lOff: 0, lAbs: 16 },
    { name: "--nc-panel-3", chan: "seed", hOff: 6, sOff: -1, lOff: 0, lAbs: 14 },
    { name: "--nc-inset", chan: "seed", hOff: 6, sOff: 2, lOff: 0, lAbs: 10 },
    { name: "--nc-hover", chan: "seed", hOff: 3, sOff: -2, lOff: 0, lAbs: 22 },
    { name: "--nc-active", chan: "seed", hOff: 3, sOff: -2, lOff: 0, lAbs: 26 },
    // Console
    { name: "--nc-console", chan: "seed", hOff: 8, sOff: 4, lOff: 0, lAbs: 7 },
    { name: "--nc-console-2", chan: "seed", hOff: 7, sOff: 1, lOff: 0, lAbs: 11 },
    { name: "--nc-console-line", chan: "seed", hOff: 6, sOff: -2, lOff: 0, lAbs: 24 },
    // Ink — inverted: near-white on dark
    { name: "--nc-ink", chan: "seed", hOff: -4, sOff: 2, lOff: 0, lAbs: 92 },
    { name: "--nc-ink-2", chan: "seed", hOff: -2, sOff: -4, lOff: 0, lAbs: 70 },
    { name: "--nc-ink-3", chan: "seed", hOff: 0, sOff: -5, lOff: 0, lAbs: 54 },
    { name: "--nc-ink-faint", chan: "seed", hOff: 2, sOff: -5, lOff: 0, lAbs: 40 },
    { name: "--nc-ink-invert", chan: "seed", hOff: -4, sOff: 4, lOff: 0, lAbs: 93 },
    { name: "--nc-ink-invert-2", chan: "seed", hOff: -2, sOff: -4, lOff: 0, lAbs: 62 },
    { name: "--nc-on-ink", chan: "seed", hOff: 6, sOff: 2, lOff: 0, lAbs: 10 },
    // Seams
    { name: "--nc-line", chan: "seed", hOff: 4, sOff: -4, lOff: 0, lAbs: 28 },
    { name: "--nc-line-subtle", chan: "seed", hOff: 5, sOff: -3, lOff: 0, lAbs: 22 },
    { name: "--nc-line-strong", chan: "seed", hOff: 2, sOff: -3, lOff: 0, lAbs: 40 },
    { name: "--nc-line-ink", chan: "seed", hOff: -4, sOff: 2, lOff: 0, lAbs: 88 },
    { name: "--nc-seam-fill", chan: "seed", hOff: 6, sOff: 2, lOff: 0, lAbs: 6 },
    // Accent — kept as-is for dark (no brightness shift)
    { name: "--nc-accent", chan: "accent", hOff: 0, sOff: 0, lOff: 0 },
    { name: "--nc-accent-hover", chan: "accent", hOff: 0, sOff: 0, lOff: 9 },
    { name: "--nc-accent-active", chan: "accent", hOff: -3, sOff: -8, lOff: -3 },
    { name: "--nc-accent-ink", chan: "accent", hOff: 2, sOff: 0, lOff: 13, sAbs: 100 },
    { name: "--nc-accent-subtle", chan: "accent", hOff: 0, sOff: 0, lOff: 3, alpha: 0.16 },
    { name: "--nc-on-accent", chan: "accent", hOff: 2, sOff: 0, lOff: 0, sAbs: 60, lAbs: 8 },
    // Semantic — brighter for dark
    { name: "--nc-success", chan: "fixed", hOff: 150, sOff: 46, lOff: 50 },
    { name: "--nc-success-subtle", chan: "fixed", hOff: 150, sOff: 46, lOff: 50, alpha: 0.16 },
    { name: "--nc-warning", chan: "fixed", hOff: 40, sOff: 92, lOff: 56 },
    { name: "--nc-warning-subtle", chan: "fixed", hOff: 40, sOff: 92, lOff: 56, alpha: 0.16 },
    { name: "--nc-error", chan: "fixed", hOff: 4, sOff: 82, lOff: 60 },
    { name: "--nc-error-subtle", chan: "fixed", hOff: 4, sOff: 82, lOff: 60, alpha: 0.16 },
    { name: "--nc-on-error", chan: "fixed", hOff: 0, sOff: 0, lOff: 100 },
    { name: "--nc-info", chan: "fixed", hOff: 206, sOff: 70, lOff: 58 },
    { name: "--nc-info-subtle", chan: "fixed", hOff: 206, sOff: 70, lOff: 58, alpha: 0.16 },
];

function deriveTheme(specs: TokenSpec[], seed: HSL, accent: HSL): DerivedTheme {
    const out: DerivedTheme = {};
    for (const spec of specs) out[spec.name] = resolve(spec, seed, accent);
    return out;
}

export function deriveAll(
    seed: HSL,
    accent: HSL,
): { light: DerivedTheme; dark: DerivedTheme } {
    return {
        light: deriveTheme(LIGHT, seed, accent),
        dark: deriveTheme(DARK, seed, accent),
    };
}
