# enclosure-vue

A typed Vue 3 **facade** over the [Enclosure](../) `.nc-*` design system.

Components emit class strings only — they **never own styling** (no `<style>` blocks,
no color/spacing props). Typed props map mechanically to modifier classes, and any
`class` / `style` / attributes you pass fall through to the root element. The single
sanctioned inline style is `Knob`'s `--nc-knob-angle` CSS variable.

## Install

```sh
npm install enclosure-vue
```

`vue` (`^3.5.13`) is a peer dependency.

## Usage

Import the stylesheet **once** at your app root, then use components anywhere:

```ts
// main.ts
import "enclosure-vue/style.css";
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Button, Field, Input, Knob, Segmented } from "enclosure-vue";
const angle = ref(0);
const seg = ref(0);
const name = ref("");
</script>

<template>
  <Button variant="accent" size="sm">Record</Button>

  <Field label="Device name" help="Must be unique." for="dev">
    <Input id="dev" v-model="name" />
  </Field>

  <Knob v-model="angle" />
  <Segmented v-model="seg" :options="['Mono', 'Stereo', 'Multi']" />
</template>
```

### Prop → class convention

Each component renders the real tag the CSS expects, always carries its base `.nc-*`
class, and turns each typed prop into exactly one modifier class. For example:

```vue
<Button variant="accent" size="sm" />
<!-- → <button class="nc-btn nc-btn--accent nc-btn--sm"> -->
```

The default value of a prop (e.g. `variant="default"`, `size="md"`) emits no modifier.

## Components

| Group       | Components                                                              |
| ----------- | ----------------------------------------------------------------------- |
| Primitives  | `Button` `Key` `Label` `Badge` `Heading` `Text` `Divider` `Panel` `Input` `Select` `Textarea` `Checkbox` `Radio` |
| Composed    | `Field` `ButtonGroup` `Segmented`                                       |
| Behavioral  | `Switch` `Knob` `Fader`                                                 |

Form controls (`Input`, `Select`, `Textarea`, `Checkbox`, `Radio`) and the behavioral
controls (`Switch`, `Knob`, `Fader`, `Segmented`) support `v-model`.

## The stylesheet

`src/style.css` is a **vendored** copy of the flat single-file Enclosure system
(`tauri-app/templates/enclosure.css`). It is never imported by a component; the build
copies it verbatim to `dist/style.css`. To retheme, replace `src/style.css` with a
freshly generated flat stylesheet that exposes the same `--nc-*` custom properties.

## Develop

```sh
npm install
npm run dev      # playground on http://localhost:5173
npm run build    # emits dist/ (es + umd bundles, d.ts, style.css)
npm run preview
```
