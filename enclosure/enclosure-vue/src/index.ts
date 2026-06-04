// enclosure-vue — typed facade over the Enclosure .nc-* design system.
// Components emit class strings only; ship the stylesheet separately via
// `import "enclosure-vue/style.css"` once at your app root.

// Primitives
export { default as Button } from "./components/Button.vue";
export { default as Key } from "./components/Key.vue";
export { default as Label } from "./components/Label.vue";
export { default as Badge } from "./components/Badge.vue";
export { default as Heading } from "./components/Heading.vue";
export { default as Text } from "./components/Text.vue";
export { default as Divider } from "./components/Divider.vue";
export { default as Panel } from "./components/Panel.vue";
export { default as Input } from "./components/Input.vue";
export { default as Select } from "./components/Select.vue";
export { default as Textarea } from "./components/Textarea.vue";
export { default as Checkbox } from "./components/Checkbox.vue";
export { default as Radio } from "./components/Radio.vue";

// Composed
export { default as Field } from "./components/Field.vue";
export { default as ButtonGroup } from "./components/ButtonGroup.vue";
export { default as Segmented } from "./components/Segmented.vue";
export { default as ExpandButton } from "./components/ExpandButton.vue";
export type { ExpandAction } from "./components/ExpandButton.vue";

// Chat
export { default as Transcript } from "./components/Transcript.vue";
export { default as Message } from "./components/Message.vue";
export { default as MessageHeader } from "./components/MessageHeader.vue";
export { default as MessageBody } from "./components/MessageBody.vue";
export { default as MessageActions } from "./components/MessageActions.vue";
export { default as Composer } from "./components/Composer.vue";
export { default as TypingIndicator } from "./components/TypingIndicator.vue";
export { default as ThinkingBlock } from "./components/ThinkingBlock.vue";

// Behavioral
export { default as Switch } from "./components/Switch.vue";
export { default as Knob } from "./components/Knob.vue";
export { default as Fader } from "./components/Fader.vue";
