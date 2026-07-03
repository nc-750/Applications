// Regenerate the distributable, flattened lab.css that Mirror (and other
// consumers) import at their app root. Run from generator-app:
//
//   npm run gen:lab-css
//
// Uses flattenRethemable so calc()/var() and the [data-theme="dark"] block
// survive (consumers keep light/dark switching + retheming). Tailwind is
// excluded by the flattener — consumers supply their own utility layer.
//
// Seeds are the Lab canonical defaults (see css/lab.seeds.css). Edit the
// SEED/ACCENT constants below to reseed every consumer in one place.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { flattenRethemable } from "../src/generator/flatten";
import type { HSL } from "../src/generator/derive";

const SEED: HSL = { h: 214, s: 14, l: 85 };
const ACCENT: HSL = { h: 18, s: 100, l: 53 };

// Consumers that receive the flattened artifact (paths relative to repo root).
const here = dirname(fileURLToPath(import.meta.url)); // lab/generator-app/scripts
const repoRoot = resolve(here, "../../..");
const TARGETS = [resolve(repoRoot, "mirror/app/src/styles/lab.css")];

const css = flattenRethemable(SEED, ACCENT);

for (const target of TARGETS) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, css, "utf8");
    console.log(`lab.css → ${target} (${css.length} bytes)`);
}
