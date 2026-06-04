// Theme state composable: seed/accent/semantic pickers, light/dark toggle,
// WCAG-AA toggle, persistence, and WYSIWYG :root overrides.

import { ref, computed, watch, type Ref } from "vue";
import {
    hslToString,
    hslToHex as deriveHslToHex,
    type HSL,
    type DerivedTheme,
    deriveAll,
} from "./derive";
import { adjustForAA, CRITICAL_PAIRS, computeComplianceScore } from "./wcag";

// Defaults match css/enclosure.seeds.css.
export const BG_DEFAULTS: HSL = { h: 214, s: 14, l: 85 };
export const ACCENT_DEFAULTS: HSL = { h: 18, s: 100, l: 53 };

// Semantic color defaults (matching LIGHT spec fixed values).
export const SEMANTIC_DEFAULTS: Record<string, HSL> = {
    success: { h: 150, s: 42, l: 36 },
    warning: { h: 38, s: 92, l: 45 },
    error: { h: 4, s: 78, l: 50 },
    info: { h: 206, s: 64, l: 44 },
};

// ── Hex ↔ HSL (ported from tauri-app/src/main.ts) ────────────────────────

export function hexToHSL(hex: string): HSL {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    switch (max) {
        case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
        case g:
            h = ((b - r) / d + 2) / 6;
            break;
        default:
            h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
    return deriveHslToHex(h, s, l);
}

// ── Singleton reactive state ──────────────────────────────────────────────

const seedHex: Ref<string> = ref(
    localStorage.getItem("nc-seed") ||
        hslToHex(BG_DEFAULTS.h, BG_DEFAULTS.s, BG_DEFAULTS.l),
);
const accentHex: Ref<string> = ref(
    localStorage.getItem("nc-accent") ||
        hslToHex(ACCENT_DEFAULTS.h, ACCENT_DEFAULTS.s, ACCENT_DEFAULTS.l),
);
const isDark: Ref<boolean> = ref(
    (localStorage.getItem("nc-theme") ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light")) === "dark",
);
const useWCAG: Ref<boolean> = ref(
    localStorage.getItem("nc-wcag") === "true",
);

// Semantic color refs (with persisted defaults).
function loadSemantic(key: string, def: HSL): Ref<string> {
    const stored = localStorage.getItem(`nc-semantic-${key}`);
    return ref(stored || hslToHex(def.h, def.s, def.l));
}

const successHex = loadSemantic("success", SEMANTIC_DEFAULTS.success);
const warningHex = loadSemantic("warning", SEMANTIC_DEFAULTS.warning);
const errorHex = loadSemantic("error", SEMANTIC_DEFAULTS.error);
const infoHex = loadSemantic("info", SEMANTIC_DEFAULTS.info);

const seed = computed<HSL>(() => hexToHSL(seedHex.value));
const accent = computed<HSL>(() => hexToHSL(accentHex.value));
const successHSL = computed<HSL>(() => hexToHSL(successHex.value));
const warningHSL = computed<HSL>(() => hexToHSL(warningHex.value));
const errorHSL = computed<HSL>(() => hexToHSL(errorHex.value));
const infoHSL = computed<HSL>(() => hexToHSL(infoHex.value));

// Current derived themes (raw or AA-adjusted depending on toggle).
const currentTheme = computed<DerivedTheme>(() => {
    const { light, dark } = deriveAll(seed.value, accent.value);
    const raw = isDark.value ? dark : light;
    return useWCAG.value ? adjustForAA(raw, CRITICAL_PAIRS) : raw;
});

// WCAG-AA compliance score for the current visible theme.
const complianceScore = computed<number>(() => {
    return computeComplianceScore(currentTheme.value, CRITICAL_PAIRS);
});

/**
 * Derive the subtle variant for a semantic color: same HSL, with alpha.
 * Alpha differs between light (0.12) and dark (0.16) to match the design.
 */
function subtleHSL(color: HSL, isDarkMode: boolean): string {
    const alpha = isDarkMode ? 0.16 : 0.12;
    return `hsl(${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}% / ${alpha})`;
}

/**
 * Apply a theme's color tokens onto :root via inline overrides,
 * making the on-screen render WYSIWYG with the exported static CSS.
 */
function applyOverrides(theme: DerivedTheme): void {
    const root = document.documentElement;
    for (const name in theme) {
        root.style.setProperty(name, hslToString(theme[name]));
    }
    // Also keep the raw seed vars in sync (for any consumer reading them,
    // and so non-overridden gradient literals still relate to the seed).
    root.style.setProperty("--nc-seed-h", String(seed.value.h));
    root.style.setProperty("--nc-seed-s", String(seed.value.s));
    root.style.setProperty("--nc-seed-l", String(seed.value.l));
    root.style.setProperty("--nc-accent-h", String(accent.value.h));
    root.style.setProperty("--nc-accent-s", String(accent.value.s));
    root.style.setProperty("--nc-accent-l", String(accent.value.l));

    // Override semantic colors with user-selected values.
    const dark = isDark.value;
    applySemanticOverride(root, "--nc-success", successHSL.value, dark);
    applySemanticOverride(root, "--nc-warning", warningHSL.value, dark);
    applySemanticOverride(root, "--nc-error", errorHSL.value, dark);
    applySemanticOverride(root, "--nc-info", infoHSL.value, dark);
}

function applySemanticOverride(
    root: HTMLElement,
    name: string,
    color: HSL,
    dark: boolean,
): void {
    root.style.setProperty(name, hslToString({ h: color.h, s: color.s, l: color.l }));
    root.style.setProperty(`${name}-subtle`, subtleHSL(color, dark));
}

function applyAll(): void {
    const root = document.documentElement;
    if (isDark.value) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    applyOverrides(currentTheme.value);
}

export function useTheme() {
    function setSeed(hex: string): void {
        seedHex.value = hex;
        localStorage.setItem("nc-seed", hex);
    }
    function setAccent(hex: string): void {
        accentHex.value = hex;
        localStorage.setItem("nc-accent", hex);
    }
    function setSemantic(key: string, hex: string): void {
        const refs: Record<string, Ref<string>> = {
            success: successHex,
            warning: warningHex,
            error: errorHex,
            info: infoHex,
        };
        const r = refs[key];
        if (r) {
            r.value = hex;
            localStorage.setItem(`nc-semantic-${key}`, hex);
        }
    }
    function toggleTheme(): void {
        isDark.value = !isDark.value;
        localStorage.setItem("nc-theme", isDark.value ? "dark" : "light");
    }
    function toggleWCAG(): void {
        useWCAG.value = !useWCAG.value;
        localStorage.setItem("nc-wcag", String(useWCAG.value));
    }
    function reset(): void {
        seedHex.value = hslToHex(BG_DEFAULTS.h, BG_DEFAULTS.s, BG_DEFAULTS.l);
        accentHex.value = hslToHex(
            ACCENT_DEFAULTS.h,
            ACCENT_DEFAULTS.s,
            ACCENT_DEFAULTS.l,
        );
        successHex.value = hslToHex(
            SEMANTIC_DEFAULTS.success.h,
            SEMANTIC_DEFAULTS.success.s,
            SEMANTIC_DEFAULTS.success.l,
        );
        warningHex.value = hslToHex(
            SEMANTIC_DEFAULTS.warning.h,
            SEMANTIC_DEFAULTS.warning.s,
            SEMANTIC_DEFAULTS.warning.l,
        );
        errorHex.value = hslToHex(
            SEMANTIC_DEFAULTS.error.h,
            SEMANTIC_DEFAULTS.error.s,
            SEMANTIC_DEFAULTS.error.l,
        );
        infoHex.value = hslToHex(
            SEMANTIC_DEFAULTS.info.h,
            SEMANTIC_DEFAULTS.info.s,
            SEMANTIC_DEFAULTS.info.l,
        );
        useWCAG.value = false;
        localStorage.removeItem("nc-seed");
        localStorage.removeItem("nc-accent");
        localStorage.removeItem("nc-semantic-success");
        localStorage.removeItem("nc-semantic-warning");
        localStorage.removeItem("nc-semantic-error");
        localStorage.removeItem("nc-semantic-info");
        localStorage.removeItem("nc-wcag");
    }

    // Re-apply on any state change.
    watch(
        [seedHex, accentHex, isDark, useWCAG, successHex, warningHex, errorHex, infoHex],
        applyAll,
        { immediate: true },
    );

    return {
        seedHex,
        accentHex,
        isDark,
        useWCAG,
        seed,
        accent,
        successHex,
        warningHex,
        errorHex,
        infoHex,
        complianceScore,
        setSeed,
        setAccent,
        setSemantic,
        toggleTheme,
        toggleWCAG,
        reset,
    };
}
