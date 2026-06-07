<script setup lang="ts">
import { ref, computed, reactive } from "vue";

interface LogEntry {
  id: string;
  marker: string;
  summary: string;
  body: string;
}

interface Task {
  id: string;
  label: string;
  name: string;
  status: "done" | "active" | "blocked" | "pending";
}

interface Dep {
  from: string;
  to: string;
}

interface Project {
  id: string;
  name: string;
  coverage: { planning: number; execution: number; review: number; shipped: number };
  momentum: number;
  tasks: Task[];
  dependencies: Dep[];
}

const dimensions = [
  { key: "planning" as const, label: "Planning" },
  { key: "execution" as const, label: "Execution" },
  { key: "review" as const, label: "Review" },
  { key: "shipped" as const, label: "Shipped" },
];

const projectsData: Project[] = [
  {
    id: "ds",
    name: "Design System",
    coverage: { planning: 88, execution: 62, review: 35, shipped: 15 },
    momentum: 0.67,
    tasks: [
      { id: "t1", label: "FND-01", name: "Color System", status: "done" },
      { id: "t2", label: "FND-02", name: "Typography", status: "done" },
      { id: "t3", label: "CTL-01", name: "Components", status: "done" },
      { id: "t4", label: "DOC-01", name: "Documentation", status: "blocked" },
      { id: "t5", label: "REL-01", name: "Release v2", status: "active" },
    ],
    dependencies: [
      { from: "t1", to: "t3" },
      { from: "t2", to: "t3" },
      { from: "t3", to: "t5" },
      { from: "t3", to: "t4" },
    ],
  },
  {
    id: "app",
    name: "Mobile App",
    coverage: { planning: 95, execution: 45, review: 20, shipped: 5 },
    momentum: 0.45,
    tasks: [
      { id: "m1", label: "DSN-01", name: "Wireframes", status: "done" },
      { id: "m2", label: "PRT-01", name: "Prototype", status: "active" },
      { id: "m3", label: "API-01", name: "API Client", status: "done" },
      { id: "m4", label: "TST-01", name: "QA Pipeline", status: "blocked" },
    ],
    dependencies: [
      { from: "m1", to: "m2" },
      { from: "m3", to: "m2" },
      { from: "m2", to: "m4" },
    ],
  },
  {
    id: "api",
    name: "API Service",
    coverage: { planning: 100, execution: 80, review: 60, shipped: 55 },
    momentum: 0.82,
    tasks: [
      { id: "a1", label: "AUTH-01", name: "Auth Module", status: "done" },
      { id: "a2", label: "DATA-01", name: "Data Layer", status: "done" },
      { id: "a3", label: "RATE-01", name: "Rate Limiting", status: "active" },
      { id: "a4", label: "MON-01", name: "Monitoring", status: "pending" },
    ],
    dependencies: [
      { from: "a1", to: "a2" },
      { from: "a2", to: "a3" },
      { from: "a3", to: "a4" },
    ],
  },
];

const initialLogs: Record<string, LogEntry[]> = {
  ds: [
    { id: "l1", marker: "OBS 01", summary: "PLANNING · MEASURED", body: "Planning coverage at 88%. All milestones identified and scoped." },
    { id: "l2", marker: "OBS 02", summary: "EXECUTION · MEASURED", body: "Execution at 62%. Component library is two weeks ahead of schedule." },
    { id: "l3", marker: "OBS 03", summary: "REVIEW · MEASURED", body: "Review at 35%. Two PRs awaiting approval, one with blocking feedback." },
  ],
  app: [
    { id: "l4", marker: "OBS 01", summary: "PLANNING · MEASURED", body: "Planning at 95%. Wireframes and user flows complete." },
    { id: "l5", marker: "OBS 02", summary: "EXECUTION · MEASURED", body: "Execution at 45%. Prototype in active development; API client integrated." },
  ],
  api: [
    { id: "l6", marker: "OBS 01", summary: "PLANNING · MEASURED", body: "Planning at 100%. Architecture review signed off." },
    { id: "l7", marker: "OBS 02", summary: "EXECUTION · MEASURED", body: "Execution at 80%. Auth and data layers deployed." },
    { id: "l8", marker: "OBS 03", summary: "REVIEW · MEASURED", body: "Review at 60%. Rate limiting needs concurrency review." },
  ],
};

interface ProjState {
  logEntries: LogEntry[];
  inspectionCount: number;
}

const projectStates = reactive<Record<string, ProjState>>(
  Object.fromEntries(projectsData.map((p) => [
    p.id,
    { logEntries: [...initialLogs[p.id]], inspectionCount: 0 },
  ])),
);

const activeIndex = ref(0);
const isInspecting = ref(false);
const showBlocked = ref(true);
const logOpen = ref<string | null>(null);

const activeProject = computed(() => projectsData[activeIndex.value]);
const activeState = computed(() => projectStates[activeProject.value.id]);

const coverage = computed(() => {
  const p = activeProject.value;
  const st = activeState.value;
  const reviewBump = Math.min(st.inspectionCount * 10, 100 - p.coverage.review);
  return {
    planning: p.coverage.planning,
    execution: p.coverage.execution,
    review: Math.min(p.coverage.review + reviewBump, 100),
    shipped: p.coverage.shipped,
  };
});

const momentumAfter = computed(() => {
  const base = activeProject.value.momentum;
  const bump = activeState.value.inspectionCount * 0.04;
  return Math.min(base + bump, 1);
});

function selectProject(i: number) {
  activeIndex.value = i;
}

function runInspection() {
  if (isInspecting.value) return;
  isInspecting.value = true;
  setTimeout(() => {
    isInspecting.value = false;
    const st = activeState.value;
    st.inspectionCount++;
    const n = st.logEntries.length + 1;
    const obs = String(n).padStart(2, "0");
    st.logEntries.push({
      id: `obs-${activeProject.value.id}-${n}`,
      marker: `OBS ${obs}`,
      summary: "REVIEW · MEASURED",
      body: `Review signal re-measured at ${coverage.value.review}%. Coverage is ${coverage.value.review >= 80 ? "sufficient." : "still building — more evidence needed."}`,
    });
  }, 2200);
}

function toggleLog(id: string) {
  logOpen.value = logOpen.value === id ? null : id;
}
</script>

<template>
  <div class="nc-band">
    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">PROJECT OVERVIEW</span></div>
        <div class="nc-cell-head__spec">INSPECT // 0x01</div>
      </div>
      <div class="nc-plate">
        <div class="nc-segment" role="tablist">
          <button
            v-for="(p, i) in projectsData"
            :key="p.id"
            :class="{ 'is-active': activeIndex === i }"
            role="tab"
            @click="selectProject(i)"
          >
            {{ p.name }}
          </button>
        </div>

        <div class="flex flex-col gap-3 mt-5">
          <div v-for="dim in dimensions" :key="dim.key">
            <div class="flex items-center justify-between mb-1">
              <span class="nc-partno">{{ dim.label }}</span>
              <span class="nc-partno">{{ coverage[dim.key] }}%</span>
            </div>
            <div
              class="nc-coverage"
              :class="{ 'nc-coverage--locked': coverage[dim.key] >= 80 }"
            >
              <div
                class="nc-coverage__fill"
                :style="{ width: coverage[dim.key] + '%' }"
              />
            </div>
          </div>
        </div>

        <hr class="nc-divider" />

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="nc-led nc-led--on">ACTIVE</span>
            <span class="nc-partno text-[var(--nc-ink-2)]">Last: 2026-06-07</span>
          </div>
          <button
            class="nc-btn nc-btn--accent"
            :disabled="isInspecting"
            @click="runInspection"
          >
            <template v-if="!isInspecting">Run Inspection ▸</template>
            <template v-else>Inspecting …</template>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="nc-band">
    <div class="nc-cell nc-cell--grow-2">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">TASK SCHEMATIC</span></div>
        <div class="nc-cell-head__spec">DOC // 0x02</div>
      </div>
      <div class="nc-plate">
        <!-- Design System diagram -->
        <div v-if="activeProject.id === 'ds'" class="flex flex-col items-center gap-3">
          <div class="flex items-center gap-2">
            <div class="nc-schematic-box text-center min-w-[110px]">
              <div class="nc-schematic-box__label">FND-01</div>
              <div class="nc-schematic-box__name">Color System</div>
            </div>
            <div class="nc-path w-10 shrink-0" />
            <div class="nc-schematic-box text-center min-w-[110px]">
              <div class="nc-schematic-box__label">CTL-01</div>
              <div class="nc-schematic-box__name">Components</div>
            </div>
            <div class="nc-path w-10 shrink-0" />
            <div class="nc-schematic-box text-center min-w-[110px]">
              <div class="nc-schematic-box__label">REL-01</div>
              <div class="nc-schematic-box__name">Release v2</div>
            </div>
          </div>
          <div v-if="showBlocked" class="flex items-center gap-2">
            <div class="nc-sever w-40">
              <div class="nc-sever__line" />
              <div class="nc-sever__mark">&#10005;</div>
              <div class="nc-sever__line" />
            </div>
            <div class="nc-schematic-box text-center min-w-[110px]">
              <div class="nc-schematic-box__label">DOC-01</div>
              <div class="nc-schematic-box__name">Documentation</div>
            </div>
          </div>
        </div>

        <!-- Mobile App diagram -->
        <div v-else-if="activeProject.id === 'app'" class="flex flex-col gap-3 items-center">
          <div class="flex items-center justify-center gap-2">
            <div class="nc-schematic-box text-center">
              <div class="nc-schematic-box__label">DSN-01</div>
              <div class="nc-schematic-box__name">Wireframes</div>
            </div>
            <div class="nc-path w-12 shrink-0" />
            <div class="nc-schematic-box text-center">
              <div class="nc-schematic-box__label">PRT-01</div>
              <div class="nc-schematic-box__name">Prototype</div>
            </div>
            <div class="nc-path w-12 shrink-0" v-if="showBlocked" />
            <div class="nc-sever w-24" v-if="showBlocked">
              <div class="nc-sever__line" />
              <div class="nc-sever__mark">&#10005;</div>
              <div class="nc-sever__line" />
            </div>
            <div class="nc-schematic-box text-center" v-if="showBlocked">
              <div class="nc-schematic-box__label">TST-01</div>
              <div class="nc-schematic-box__name">QA Pipeline</div>
            </div>
          </div>
          <div class="flex items-center justify-center gap-2 pl-[80px]">
            <div class="nc-schematic-box text-center">
              <div class="nc-schematic-box__label">API-01</div>
              <div class="nc-schematic-box__name">API Client</div>
            </div>
            <div class="nc-path w-12 shrink-0" />
            <span class="text-[var(--nc-ink-3)] text-xs font-mono">↑</span>
          </div>
        </div>

        <!-- API Service diagram -->
        <div v-else class="flex items-center justify-center gap-2">
          <div class="nc-schematic-box text-center">
            <div class="nc-schematic-box__label">AUTH-01</div>
            <div class="nc-schematic-box__name">Auth Module</div>
          </div>
          <div class="nc-path w-8 shrink-0" />
          <div class="nc-schematic-box text-center">
            <div class="nc-schematic-box__label">DATA-01</div>
            <div class="nc-schematic-box__name">Data Layer</div>
          </div>
          <div class="nc-path w-8 shrink-0" />
          <div class="nc-schematic-box text-center">
            <div class="nc-schematic-box__label">RATE-01</div>
            <div class="nc-schematic-box__name">Rate Limiting</div>
          </div>
          <div class="nc-path w-8 shrink-0" />
          <div class="nc-schematic-box text-center">
            <div class="nc-schematic-box__label">MON-01</div>
            <div class="nc-schematic-box__name">Monitoring</div>
          </div>
        </div>

        <label class="nc-toggle mt-4">
          <input type="checkbox" v-model="showBlocked" />
          Show blocked tasks
        </label>
      </div>
    </div>

    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">SIGNAL TRACE</span></div>
        <div class="nc-cell-head__spec">LIVE</div>
      </div>
      <div class="nc-monitor rounded-[var(--nc-radius-md)] p-4 min-h-[240px]">
        <div v-if="isInspecting" class="flex flex-col items-center justify-center gap-3 h-full">
          <div class="nc-acquire">
            <div class="nc-acquire__wave">
              <div class="nc-acquire__bar" />
              <div class="nc-acquire__bar" />
              <div class="nc-acquire__bar" />
              <div class="nc-acquire__bar" />
              <div class="nc-acquire__bar" />
            </div>
            <div class="nc-acquire__label">INSPECTING …</div>
          </div>
        </div>

        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="nc-lcd nc-lcd--lg">{{ momentumAfter.toFixed(2) }}</span>
            <span class="nc-lcd-sub">MOMENTUM</span>
          </div>

          <div class="nc-facet mt-3">ACTIVITY PATTERN</div>

          <div v-for="dim in dimensions" :key="dim.key" class="mt-3">
            <div class="flex items-center justify-between mb-0.5">
              <span class="nc-lcd-sub text-xs">{{ dim.label }}</span>
              <span class="nc-lcd-sub text-xs">{{ coverage[dim.key] }}%</span>
            </div>
            <div class="nc-coverage h-[5px]">
              <div
                class="nc-coverage__fill"
                :style="{ width: coverage[dim.key] + '%' }"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 mt-4">
            <span class="nc-led nc-led--rec">SIGNAL ACTIVE</span>
            <span class="nc-mono text-[var(--nc-ink-invert-2)] text-2xs">OBS {{ activeState.logEntries.length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="nc-band">
    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">SESSION LOG</span></div>
        <div class="nc-cell-head__spec">APPEND-ONLY</div>
      </div>
      <div class="nc-log">
        <div
          v-for="entry in activeState.logEntries"
          :key="entry.id"
          class="nc-log__entry"
          :class="{ 'nc-log__entry--open': logOpen === entry.id }"
        >
          <button class="nc-log__summary" @click="toggleLog(entry.id)">
            <span class="nc-log__marker">{{ entry.marker }}</span>
            <span>{{ entry.summary }}</span>
          </button>
          <div class="nc-log__body">{{ entry.body }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
