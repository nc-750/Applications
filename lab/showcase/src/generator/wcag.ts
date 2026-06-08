// WCAG-AA auto-adjust for derived Lab themes.
//
// Strategy: derive both themes from the 6 seeds, then for each critical
// foreground/background pair, nudge the FOREGROUND token's lightness by 1%
// toward higher contrast until it meets its minimum ratio (4.5:1 normal,
// 3:1 large/UI). Backgrounds stay fixed so the overall look holds.

import {
    deriveAll,
    hslToHex,
    type DerivedColor,
    type DerivedTheme,
    type HSL,
} from "./derive";

// ── sRGB relative luminance + contrast ratio ─────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
    ];
}

function relLuminance(r: number, g: number, b: number): number {
    const lin = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function luminanceOfHex(hex: string): number {
    const [r, g, b] = hexToRgb(hex);
    return relLuminance(r, g, b);
}

/** Contrast ratio between two opaque hex colors. */
export function contrastRatio(c1: string, c2: string): number {
    const l1 = luminanceOfHex(c1);
    const l2 = luminanceOfHex(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ── Compositing translucent surfaces over an opaque base ─────────────────

function colorToHex(c: DerivedColor): string {
    return hslToHex(c.h, c.s, c.l);
}

/**
 * Composite a (possibly translucent) color over an opaque base color,
 * returning an opaque hex. Used so `*-subtle` alpha backgrounds are tested
 * as they actually render (over their base surface).
 */
function compositeOver(fg: DerivedColor, base: DerivedColor): string {
    const a = fg.a ?? 1;
    if (a >= 1) return colorToHex(fg);
    const [fr, fgc, fb] = hexToRgb(colorToHex(fg));
    const [br, bg, bb] = hexToRgb(colorToHex(base));
    const r = fr * a + br * (1 - a);
    const g = fgc * a + bg * (1 - a);
    const b = fb * a + bb * (1 - a);
    const toHex = (v: number) =>
        Math.round(v * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Critical pairs ────────────────────────────────────────────────────────

export interface Pair {
    fg: string; // foreground var name (the token we nudge)
    bg: string; // background var name
    over?: string; // if bg is translucent, composite it over this base first
    min: number; // required contrast ratio
}

const NORMAL = 4.5;
const LARGE = 3;

// Ordered most-important first. Backgrounds for `*-subtle` semantics are the
// subtle fill composited over `--nc-panel` (their typical container).
export const CRITICAL_PAIRS: Pair[] = [
    // Body text on surfaces (normal text)
    { fg: "--nc-ink", bg: "--nc-bg", min: NORMAL },
    { fg: "--nc-ink", bg: "--nc-panel", min: NORMAL },
    { fg: "--nc-ink-2", bg: "--nc-panel", min: NORMAL },
    { fg: "--nc-ink-2", bg: "--nc-bg", min: NORMAL },
    // Text on accent / ink
    { fg: "--nc-on-accent", bg: "--nc-accent", min: NORMAL },
    { fg: "--nc-on-ink", bg: "--nc-ink", min: NORMAL },
    { fg: "--nc-ink-invert", bg: "--nc-console", min: NORMAL },
    { fg: "--nc-on-error", bg: "--nc-error", min: NORMAL },
    // Semantic text over its own subtle fill (composited over panel)
    { fg: "--nc-success", bg: "--nc-success-subtle", over: "--nc-panel", min: NORMAL },
    { fg: "--nc-warning", bg: "--nc-warning-subtle", over: "--nc-panel", min: NORMAL },
    { fg: "--nc-error", bg: "--nc-error-subtle", over: "--nc-panel", min: NORMAL },
    { fg: "--nc-info", bg: "--nc-info-subtle", over: "--nc-panel", min: NORMAL },
    // Large / UI (3:1)
    { fg: "--nc-ink-3", bg: "--nc-bg", min: LARGE },
    { fg: "--nc-ink-3", bg: "--nc-panel", min: LARGE },
    { fg: "--nc-accent", bg: "--nc-bg", min: LARGE },
    { fg: "--nc-accent", bg: "--nc-panel", min: LARGE },
    { fg: "--nc-line-strong", bg: "--nc-bg", min: LARGE },
];

/** Resolve the opaque hex of a background (compositing if translucent). */
function bgHex(theme: DerivedTheme, pair: Pair): string {
    const bg = theme[pair.bg];
    if (!bg) return "#000000";
    if ((bg.a ?? 1) >= 1) return colorToHex(bg);
    const base = pair.over ? theme[pair.over] : undefined;
    return base ? compositeOver(bg, base) : colorToHex(bg);
}

/** Foreground hex (composited over its bg if the fg itself is translucent). */
function fgHex(theme: DerivedTheme, pair: Pair): string {
    const fg = theme[pair.fg];
    if (!fg) return "#000000";
    if ((fg.a ?? 1) >= 1) return colorToHex(fg);
    return compositeOver(fg, theme[pair.bg] ?? fg);
}

/** Contrast of a foreground color (given its L) against an opaque bg hex. */
function ratioAtL(
    fg: DerivedColor,
    l: number,
    bgC: string,
    bgColorForComposite: DerivedColor | undefined,
): number {
    const test = { ...fg, l };
    const hex =
        (fg.a ?? 1) >= 1
            ? colorToHex(test)
            : compositeOver(test, bgColorForComposite ?? test);
    return contrastRatio(hex, bgC);
}

/**
 * Nudge a single pair's foreground L to meet `min`, choosing the SMALLEST |ΔL|
 * in either direction that achieves it. Robust to the non-monotonic "valley"
 * (e.g. white text darkening past a mid-tone bg). Returns true if it now passes.
 * Backgrounds stay fixed so the look holds.
 */
function nudgePair(out: DerivedTheme, pair: Pair): boolean {
    const fg = out[pair.fg];
    if (!fg) return true;
    const bgC = bgHex(out, pair);
    const bgColor = out[pair.bg];
    const startL = fg.l;

    if (ratioAtL(fg, startL, bgC, bgColor) >= pair.min) return true;

    // Search outward symmetrically for the nearest L (in 1% steps) that passes.
    for (let d = 1; d <= 100; d++) {
        const up = startL + d;
        if (up <= 100 && ratioAtL(fg, up, bgC, bgColor) >= pair.min) {
            fg.l = up;
            return true;
        }
        const down = startL - d;
        if (down >= 0 && ratioAtL(fg, down, bgC, bgColor) >= pair.min) {
            fg.l = down;
            return true;
        }
    }
    // Unreachable within 0..100: settle on the extreme with the best ratio so
    // we at least maximize legibility, then report.
    const r0 = ratioAtL(fg, 0, bgC, bgColor);
    const r100 = ratioAtL(fg, 100, bgC, bgColor);
    fg.l = r100 >= r0 ? 100 : 0;
    return false;
}

/**
 * Auto-adjust a single theme to meet AA on the given pairs.
 * Mutates a clone. Pairs are processed in priority order; because some
 * foregrounds are also other pairs' backgrounds (e.g. --nc-accent), we repeat
 * passes until the set is stable (or a cap is reached), then warn on any
 * pair that remains physically unreachable.
 */
export function adjustForAA(theme: DerivedTheme, pairs: Pair[]): DerivedTheme {
    const out: DerivedTheme = {};
    for (const k in theme) out[k] = { ...theme[k] };

    const MAX_PASSES = 8;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
        let changed = false;
        for (const pair of pairs) {
            const before = out[pair.fg]?.l;
            nudgePair(out, pair);
            if (out[pair.fg] && out[pair.fg].l !== before) changed = true;
        }
        if (!changed) break;
    }

    // Final report: anything still below min is physically unreachable by
    // foreground-L alone; we keep the best-effort value rather than blocking.
    for (const pair of pairs) {
        const fg = out[pair.fg];
        if (!fg) continue;
        const bgC = bgHex(out, pair);
        const r = ratioAtL(fg, fg.l, bgC, out[pair.bg]);
        if (r + 0.005 < pair.min) {
            console.warn(
                `[wcag] ${pair.fg} on ${pair.bg}: hit bound before AA ` +
                    `(${r.toFixed(2)} < ${pair.min})`,
            );
        }
    }
    return out;
}

/** Derive both themes from seeds, then AA-adjust each. */
export function buildAdjustedThemes(
    seed: HSL,
    accent: HSL,
): { light: DerivedTheme; dark: DerivedTheme } {
    const { light, dark } = deriveAll(seed, accent);
    return {
        light: adjustForAA(light, CRITICAL_PAIRS),
        dark: adjustForAA(dark, CRITICAL_PAIRS),
    };
}

/** Compute WCAG-AA compliance score as percentage of critical pairs that pass. */
export function computeComplianceScore(
    theme: DerivedTheme,
    pairs: Pair[],
): number {
    if (pairs.length === 0) return 100;
    let passed = 0;
    for (const pair of pairs) {
        const bg = bgHex(theme, pair);
        const fg = fgHex(theme, pair);
        const ratio = contrastRatio(fg, bg);
        if (ratio + 0.005 >= pair.min) passed++;
    }
    return Math.round((passed / pairs.length) * 100);
}

// Re-export so callers / verify can composite for diagnostics.
export { compositeOver, colorToHex, luminanceOfHex, bgHex, fgHex };
