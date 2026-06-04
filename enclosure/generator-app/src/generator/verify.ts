// Verification harness for the Enclosure generator (Task 1, F-1 + F-3).
// Run: npm run verify  (vite-node src/generator/verify.ts)
//
// F-1: for a seed matrix (defaults + adversarial), assert every critical
//      pair meets its AA minimum after buildAdjustedThemes, for BOTH themes.
// F-3: assert the static flatten output contains a concrete hsl() for every
//      derived color token and contains no `calc(` and no `--nc-seed-`.

// Node global (this script runs under vite-node, not in the browser bundle).
declare const process: { exit(code: number): never };

import type { HSL } from "./derive";
import { hslToHex } from "./derive";
import {
    buildAdjustedThemes,
    contrastRatio,
    CRITICAL_PAIRS,
    bgHex,
    fgHex,
    type Pair,
} from "./wcag";
import { flattenStatic } from "./flatten";
import { LIGHT, DARK } from "./derive";

// hex of a seed's own picker value (for printing only)
function seedHex(c: HSL): string {
    return hslToHex(c.h, c.s, c.l);
}

/** Extract the bodies of the :root and [data-theme="dark"] token blocks. */
function extractTokenBlocks(css: string): string[] {
    const blocks: string[] = [];
    for (const re of [
        /:root\s*\{/g,
        /\[data-theme="dark"\]\s*\{/g,
    ]) {
        const m = re.exec(css);
        if (!m) continue;
        let depth = 1;
        let i = m.index + m[0].length;
        const start = i;
        for (; i < css.length; i++) {
            if (css[i] === "{") depth++;
            else if (css[i] === "}" && --depth === 0) break;
        }
        blocks.push(css.slice(start, i));
    }
    return blocks;
}

interface Seed {
    label: string;
    seed: HSL;
    accent: HSL;
}

const SEEDS: Seed[] = [
    {
        label: "defaults (214/14/85 · 18/100/53)",
        seed: { h: 214, s: 14, l: 85 },
        accent: { h: 18, s: 100, l: 53 },
    },
    {
        label: "very-light accent (45/100/92)",
        seed: { h: 214, s: 14, l: 85 },
        accent: { h: 45, s: 100, l: 92 },
    },
    {
        label: "low-contrast base (214/5/60)",
        seed: { h: 214, s: 5, l: 60 },
        accent: { h: 18, s: 100, l: 53 },
    },
    {
        label: "near-white base (0/0/98)",
        seed: { h: 0, s: 0, l: 98 },
        accent: { h: 18, s: 100, l: 53 },
    },
    {
        label: "dark base (220/20/20)",
        seed: { h: 220, s: 20, l: 20 },
        accent: { h: 18, s: 100, l: 53 },
    },
    {
        label: "neon accent (90/100/70)",
        seed: { h: 214, s: 14, l: 85 },
        accent: { h: 90, s: 100, l: 70 },
    },
];

let failures = 0;
const rows: string[] = [];

function checkTheme(
    label: string,
    themeName: "light" | "dark",
    theme: ReturnType<typeof buildAdjustedThemes>["light"],
    pairs: Pair[],
): void {
    for (const pair of pairs) {
        const bg = bgHex(theme, pair);
        const fg = fgHex(theme, pair);
        const ratio = contrastRatio(fg, bg);
        const pass = ratio + 0.005 >= pair.min; // tiny epsilon for rounding
        if (!pass) failures++;
        rows.push(
            `${pass ? "PASS" : "FAIL"}  ${themeName.padEnd(5)}  ` +
                `${pair.fg} / ${pair.bg}`.padEnd(42) +
                `${ratio.toFixed(2)} (min ${pair.min})  [${label}]`,
        );
    }
}

console.log("== F-1: WCAG-AA after buildAdjustedThemes ==\n");
for (const s of SEEDS) {
    const { light, dark } = buildAdjustedThemes(s.seed, s.accent);
    rows.push(`-- ${s.label}  base=${seedHex(s.seed)} accent=${seedHex(s.accent)}`);
    checkTheme(s.label, "light", light, CRITICAL_PAIRS);
    checkTheme(s.label, "dark", dark, CRITICAL_PAIRS);
    rows.push("");
}
console.log(rows.join("\n"));

// ── F-3: static output sanity ─────────────────────────────────────────────
console.log("== F-3: static flatten sanity ==\n");
let f3Failures = 0;

for (const s of SEEDS.slice(0, 2)) {
    const css = flattenStatic(s.seed, s.accent);
    const before = f3Failures;

    // Seed vars must be fully resolved away everywhere.
    if (css.includes("--nc-seed-")) {
        console.log(`FAIL  [${s.label}] static output still contains --nc-seed-`);
        f3Failures++;
    }
    // No calc() may remain inside any color token (token blocks). Layout
    // calc() in component rules is legitimate and stays verbatim, so we scope
    // the check to the :root / dark token blocks.
    for (const block of extractTokenBlocks(css)) {
        if (block.includes("calc(")) {
            console.log(`FAIL  [${s.label}] token block still contains calc(`);
            f3Failures++;
            break;
        }
    }

    // Every derived color token must appear as a concrete hsl() literal.
    const tokenNames = new Set([...LIGHT, ...DARK].map((t) => t.name));
    for (const name of tokenNames) {
        const re = new RegExp(
            `${name.replace(/[-]/g, "\\-")}\\s*:\\s*hsl\\(`,
        );
        if (!re.test(css)) {
            console.log(`FAIL  [${s.label}] ${name} not rewritten to hsl()`);
            f3Failures++;
        }
    }

    if (f3Failures === before) {
        console.log(`PASS  [${s.label}] no calc()/--nc-seed- in token blocks, all color tokens are hsl() literals`);
    }
}

failures += f3Failures;

console.log(
    `\n== RESULT: ${failures === 0 ? "PASS" : "FAIL"} (${failures} failing checks) ==`,
);
if (failures > 0) process.exit(1);
