<script setup lang="ts">
import { ref } from "vue";
import {
  Button,
  Key,
  Label,
  Badge,
  Heading,
  Text,
  Divider,
  Panel,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  Field,
  ButtonGroup,
  Segmented,
  Switch,
  Knob,
  Fader,
  ExpandButton,
  Transcript,
  Message,
  MessageHeader,
  MessageBody,
  MessageActions,
  Composer,
  TypingIndicator,
  ThinkingBlock,
} from "../index";
import type { ExpandAction } from "../index";

// Behavioral state
const sw1 = ref(true);
const sw2 = ref(false);
const gainAngle = ref(-120);
const mixAngle = ref(90);
const activeSeg = ref(0);
const vol = ref(70);
const tone = ref(40);
const fx = ref(85);

// Form state
const name = ref("TP-7 / UNIT-065");
const src = ref("");
const region = ref("us-east-1");
const notes = ref("");
const phantom = ref(true);
const hpf = ref(false);
const rate = ref("44.1");

// Expandable button actions
const exportActions: ExpandAction[] = [
  { label: "Export rethemable CSS", action: () => console.log("Export rethemable") },
  { label: "Export static CSS", action: () => console.log("Export static") },
];
const fileActions: ExpandAction[] = [
  { label: "New project", action: () => console.log("New") },
  { label: "Open…", action: () => console.log("Open") },
  { label: "Save as…", action: () => console.log("Save") },
];

// Chat state
const composerText = ref("");
const thinkingOpen = ref(false);
const messages = ref([
  { variant: "assistant" as const, name: "Lab AI", time: "12:01", body: "Welcome to the chat demo. This transcript showcases all message variants in the Lab design language." },
  { variant: "user" as const, name: "You", time: "12:02", body: "Looks clean. Show me what else it can do." },
  { variant: "assistant" as const, name: "Lab AI", time: "12:02", body: "Here is a code sample:" },
]);
function onSend(text: string) {
  messages.value.push({ variant: "user", name: "You", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), body: text });
}
</script>

<template>
  <main style="max-width: 980px; margin: 0 auto; padding: var(--nc-space-8); display: flex; flex-direction: column; gap: var(--nc-space-10)">
    <header style="display: flex; flex-direction: column; gap: var(--nc-space-2)">
      <Label>lab-vue · playground</Label>
      <Heading :level="1">Component Facade</Heading>
      <Text tone="secondary">Every component bound to live state. Open DevTools to inspect emitted .nc-* classes.</Text>
    </header>

    <!-- Typography & badges -->
    <Panel>
      <Heading :level="3">Typography &amp; Badges</Heading>
      <Divider />
      <Heading :level="2">Heading 2</Heading>
      <Heading :level="4">Heading 4</Heading>
      <Text>Body text, default tone.</Text>
      <Text tone="secondary">Secondary tone.</Text>
      <Text tone="muted">Muted tone.</Text>
      <Text tone="accent">Accent tone.</Text>
      <Divider subtle />
      <div style="display: flex; gap: var(--nc-space-3); flex-wrap: wrap">
        <Badge>Default</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </div>
    </Panel>

    <!-- Buttons & keys -->
    <Panel>
      <Heading :level="3">Buttons &amp; Keys</Heading>
      <Divider />
      <Label>Variants</Label>
      <div style="display: flex; gap: var(--nc-space-4); flex-wrap: wrap; align-items: center; margin-top: var(--nc-space-3)">
        <Button variant="accent">Record</Button>
        <Button variant="primary">Primary</Button>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button disabled>Disabled</Button>
      </div>
      <Divider subtle />
      <Label>Sizes · icon · group</Label>
      <div style="display: flex; gap: var(--nc-space-4); flex-wrap: wrap; align-items: center; margin-top: var(--nc-space-3)">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button icon aria-label="Settings">&#9881;</Button>
        <Button icon variant="accent" aria-label="Power">&#9211;</Button>
        <ButtonGroup>
          <Button>Mono</Button>
          <Button variant="primary">Stereo</Button>
          <Button>Multi</Button>
        </ButtonGroup>
      </div>
      <Divider subtle />
      <Label>Keycaps</Label>
      <div style="display: flex; gap: var(--nc-space-4); flex-wrap: wrap; align-items: center; margin-top: var(--nc-space-3)">
        <Key>esc</Key>
        <Key>&#8984;</Key>
        <Key>Q</Key>
        <Key accent>&#9166;</Key>
      </div>
      <Divider subtle />
      <Label>Expandable button</Label>
      <div style="display: flex; gap: var(--nc-space-4); flex-wrap: wrap; align-items: flex-start; margin-top: var(--nc-space-3)">
        <ExpandButton label="Export CSS" :actions="exportActions" />
        <ExpandButton label="File" :actions="fileActions" variant="primary" />
        <ExpandButton label="More" :actions="fileActions" variant="secondary" />
      </div>
    </Panel>

    <!-- Tactile controls -->
    <Panel>
      <Heading :level="3">Tactile Controls</Heading>
      <Divider />
      <div style="display: flex; gap: var(--nc-space-12); flex-wrap: wrap; align-items: flex-end">
        <div style="display: flex; flex-direction: column; gap: var(--nc-space-3)">
          <Label>Switches</Label>
          <div style="display: flex; gap: var(--nc-space-3)">
            <Switch v-model="sw1" />
            <Switch v-model="sw2" />
          </div>
          <Text size="xs" tone="muted">sw1={{ sw1 }} · sw2={{ sw2 }}</Text>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--nc-space-3)">
          <Label>Rotary</Label>
          <div style="display: flex; gap: var(--nc-space-5)">
            <div style="display: flex; flex-direction: column; gap: var(--nc-space-2); align-items: center">
              <Knob v-model="gainAngle" />
              <span class="nc-partno">GAIN {{ gainAngle }}&deg;</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--nc-space-2); align-items: center">
              <Knob v-model="mixAngle" />
              <span class="nc-partno">MIX {{ mixAngle }}&deg;</span>
            </div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--nc-space-3)">
          <Label>Faders</Label>
          <div style="display: flex; gap: var(--nc-space-4)">
            <Fader v-model="vol" label="VOL" />
            <Fader v-model="tone" label="TONE" />
            <Fader v-model="fx" label="FX" />
          </div>
          <Text size="xs" tone="muted">{{ vol }} / {{ tone }} / {{ fx }}</Text>
        </div>
      </div>
      <Divider />
      <Label>Segmented control (index {{ activeSeg }})</Label>
      <div style="margin-top: var(--nc-space-3)">
        <Segmented v-model="activeSeg" :options="['Mono', 'Stereo', 'Multi']" />
      </div>
    </Panel>

    <!-- Forms & inputs -->
    <Panel>
      <Heading :level="3">Forms &amp; Inputs</Heading>
      <Divider />
      <div style="display: flex; gap: var(--nc-space-8); flex-wrap: wrap">
        <div style="width: 340px; display: flex; flex-direction: column; gap: var(--nc-space-4)">
          <Field label="Device name" for="f-name">
            <Input id="f-name" type="text" v-model="name" />
          </Field>
          <Field label="Input source" for="f-src" help="Must be unique within the rack.">
            <Input id="f-src" type="text" placeholder="Enter channel…" v-model="src" />
          </Field>
          <Field label="Region" for="f-region">
            <Select id="f-region" v-model="region">
              <option>us-east-1</option>
              <option>eu-west-2</option>
              <option>ap-southeast-1</option>
            </Select>
          </Field>
          <Field label="Notes" for="f-notes">
            <Textarea id="f-notes" placeholder="Write something…" v-model="notes" />
          </Field>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--nc-space-3)">
          <Label>Checkbox</Label>
          <Checkbox v-model="phantom">Phantom power</Checkbox>
          <Checkbox v-model="hpf">High-pass filter</Checkbox>
          <Divider subtle />
          <Label>Radio (selected: {{ rate }})</Label>
          <Radio v-model="rate" name="sample-rate" value="44.1">44.1 kHz</Radio>
          <Radio v-model="rate" name="sample-rate" value="48">48 kHz</Radio>
          <Radio v-model="rate" name="sample-rate" value="96">96 kHz</Radio>
        </div>
      </div>
    </Panel>

    <!-- Chat -->
    <Panel>
      <Heading :level="3">Chat</Heading>
      <Divider />
      <Transcript style="max-height: 420px;">
        <Message
          v-for="(msg, i) in messages"
          :key="i"
          :variant="msg.variant"
        >
          <MessageHeader :name="msg.name" :time="msg.time" />
          <MessageBody>
            <p>{{ msg.body }}</p>
          </MessageBody>
        </Message>

        <!-- Code block example -->
        <Message variant="assistant">
          <MessageHeader name="Lab AI" time="12:03" />
          <MessageBody>
            <p>Here is a code sample:</p>
            <pre><code>const chat = new LabChat();
chat.send("Hello, world!");</code></pre>
            <p>Inline <code>--nc-accent</code> tokens work too.</p>
          </MessageBody>
          <MessageActions>
            <Button variant="ghost" size="sm">Copy</Button>
            <Button variant="ghost" size="sm">Edit</Button>
          </MessageActions>
        </Message>

        <!-- System message -->
        <Message variant="system">Model changed to <strong>Opus 4.8</strong></Message>

        <!-- Thinking block -->
        <Message variant="assistant">
          <MessageHeader name="Lab AI" time="12:04" />
          <ThinkingBlock v-model:open="thinkingOpen" label="THINKING">
            <p>Let me analyze this request step by step. The user wants to understand the component architecture. I should explain the CSS token system, the Vue facade pattern, and how they compose together.</p>
          </ThinkingBlock>
          <MessageBody>
            <p>The Lab design system uses a two-layer architecture: CSS custom properties define the visual language, and Vue components emit class strings mapped to typed props.</p>
          </MessageBody>
        </Message>

        <!-- Error message -->
        <Message variant="error">
          <MessageHeader name="System" time="12:05" />
          <MessageBody>
            <p><strong>Connection lost.</strong> The model endpoint returned a 503 error. Retrying in 3 seconds…</p>
          </MessageBody>
        </Message>

        <!-- Typing indicator -->
        <Message variant="assistant">
          <MessageHeader name="Lab AI" />
          <TypingIndicator label="ASSISTANT TYPING" />
        </Message>
      </Transcript>

      <Divider subtle />
      <Composer
        v-model="composerText"
        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
        @send="onSend"
      />
    </Panel>
  </main>
</template>
