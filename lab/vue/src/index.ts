// lab-vue — typed facade over the Lab .nc-* design system.
// Components emit class strings only and ship NO CSS. Import the Lab
// stylesheet (lab.css) exactly once at your app root; lab-vue verifies it is
// loaded at runtime (see ./guard) and fails loud if it is missing.
import "./guard";
export { Lab, assertLabCss } from "./guard";

// Layout
export { default as ChassisHeader } from "./components/ChassisHeader.vue";
export { default as ChassisFooter } from "./components/ChassisFooter.vue";
export { default as Band } from "./components/Band.vue";
export { default as Cell } from "./components/Cell.vue";

// Primitives
export { default as Button } from "./components/Button.vue";
export { default as Key } from "./components/Key.vue";
export { default as Label } from "./components/Label.vue";
export { default as Badge } from "./components/Badge.vue";
export { default as Heading } from "./components/Heading.vue";
export { default as Text } from "./components/Text.vue";
export { default as Divider } from "./components/Divider.vue";
export { default as Null } from "./components/Null.vue";
export { default as Input } from "./components/Input.vue";
export { default as Select } from "./components/Select.vue";
export { default as Textarea } from "./components/Textarea.vue";
export { default as Checkbox } from "./components/Checkbox.vue";
export { default as Radio } from "./components/Radio.vue";

// Forms
export { default as Form } from "./components/Form.vue";
export { default as FormField } from "./components/FormField.vue";
export { default as TextField } from "./components/TextField.vue";

// Composed
export { default as Field } from "./components/Field.vue";
export { default as ButtonGroup } from "./components/ButtonGroup.vue";
export { default as Segmented } from "./components/Segmented.vue";
export { default as ExpandButton } from "./components/ExpandButton.vue";
export type { ExpandAction } from "./components/ExpandButton.vue";
export { default as CellHead } from "./components/CellHead.vue";

// Diagram
export { default as SchematicBox } from "./components/SchematicBox.vue";
export { default as Path } from "./components/Path.vue";
export { default as Sever } from "./components/Sever.vue";
export { default as Leader } from "./components/Leader.vue";
export { default as Exploded } from "./components/Exploded.vue";
export { default as Glyph } from "./components/Glyph.vue";

// Instrument
export { default as Facet } from "./components/Facet.vue";
export { default as Coverage } from "./components/Coverage.vue";
export { default as Acquire } from "./components/Acquire.vue";
export { default as SessionLog } from "./components/SessionLog.vue";
