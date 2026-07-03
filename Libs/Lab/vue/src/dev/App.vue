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
  Null,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  Field,
  ButtonGroup,
  Segmented,
  ExpandButton,
  CellHead,
} from "../index";
import type { ExpandAction } from "../index";

// Controls state
const activeSeg = ref(0);

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
</script>

<template>
  <main style="max-width: 980px; margin: 0 auto; padding: var(--nc-space-8); display: flex; flex-direction: column; gap: var(--nc-space-10)">
    <header style="display: flex; flex-direction: column; gap: var(--nc-space-2)">
      <Label>lab-vue · playground</Label>
      <Heading :level="1">Component Facade</Heading>
      <Text tone="secondary">Every component bound to live state. Open DevTools to inspect emitted .nc-* classes.</Text>
    </header>

    <!-- Typography & badges -->
    <section class="nc-cell">
      <CellHead>
        <template #title><Heading :level="3">Typography &amp; Badges</Heading></template>
        <span class="nc-partno">TYPO-001</span>
      </CellHead>
      <Divider />
      <Heading :level="2">Heading 2</Heading>
      <Heading :level="4">Heading 4</Heading>
      <Text>Body text, default tone.</Text>
      <Text tone="secondary">Secondary tone.</Text>
      <Text tone="muted">Muted tone.</Text>
      <Text tone="accent">Accent tone.</Text>
      <Divider subtle />
      <div style="display: flex; gap: var(--nc-space-3); flex-wrap: wrap; align-items: center">
        <Badge>Default</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
        <Null />
      </div>
    </section>

    <!-- Buttons & keys -->
    <section class="nc-cell">
      <CellHead>
        <template #title><Heading :level="3">Buttons &amp; Keys</Heading></template>
        <span class="nc-partno">CTRL-002</span>
      </CellHead>
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
    </section>

    <!-- Controls -->
    <section class="nc-cell">
      <CellHead>
        <template #title><Heading :level="3">Controls</Heading></template>
        <span class="nc-partno">SEG-003</span>
      </CellHead>
      <Divider />
      <Label>Segmented control (index {{ activeSeg }})</Label>
      <div style="margin-top: var(--nc-space-3)">
        <Segmented v-model="activeSeg" :options="['Mono', 'Stereo', 'Multi']" />
      </div>
    </section>

    <!-- Forms & inputs -->
    <section class="nc-cell">
      <CellHead>
        <template #title><Heading :level="3">Forms &amp; Inputs</Heading></template>
        <span class="nc-partno">FORM-004</span>
      </CellHead>
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
    </section>
  </main>
</template>
