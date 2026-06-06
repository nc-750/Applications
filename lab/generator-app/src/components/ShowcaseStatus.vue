<script setup lang="ts">
import SectionWrapper from "./SectionWrapper.vue";
</script>

<template>
    <SectionWrapper num="07" title="Status &amp; Data" partno="STA-DAT"
        desc="LEDs, badges, progress meters, alerts, and tables — all sharing the monospace label grammar.">
        <div class="flex items-start gap-8">
            <!-- Status LEDs -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Status LEDs</span>
                <span class="nc-led nc-led--on">SYSTEM ONLINE</span>
                <span class="nc-led nc-led--rec">RECORDING ACTIVE</span>
                <span class="nc-led nc-led--warn">BUFFER 82%</span>
                <span class="nc-led nc-led--err">MODULE OFFLINE</span>
            </div>

            <!-- Badges & Progress -->
            <div class="flex flex-col gap-3">
                <span class="nc-label">Badges</span>
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="nc-badge nc-badge--accent nc-pill">&#9679; Live</span>
                    <span class="nc-badge nc-pill">Standby</span>
                    <span class="nc-badge">v3.4.1</span>
                    <span class="nc-badge nc-badge--success">Pass</span>
                    <span class="nc-badge nc-badge--error">Fail</span>
                </div>

                <span class="nc-label mt-4">Meters</span>
                <div class="w-[240px]">
                    <div class="nc-progress">
                        <div class="nc-progress__bar w-[62%]"></div>
                    </div>
                </div>
                <div class="w-[240px]">
                    <div class="nc-progress nc-progress--warning">
                        <div class="nc-progress__bar w-[82%]"></div>
                    </div>
                </div>
                <div class="w-[240px]">
                    <div class="nc-progress nc-progress--success">
                        <div class="nc-progress__bar w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <hr class="nc-divider" />

        <!-- Alerts -->
        <div class="flex flex-col gap-3">
            <div class="nc-alert nc-alert--info" role="status">
                <span>Information — the system has completed the requested scan.</span>
            </div>
            <div class="nc-alert nc-alert--success" role="status">
                <span>Success — all 14 modules deployed without errors.</span>
            </div>
            <div class="nc-alert nc-alert--warning" role="alert">
                <span>Warning — disk usage has reached 82% of allocated capacity.</span>
            </div>
            <div class="nc-alert nc-alert--error" role="alert">
                <span>Error — connection to node <strong>us-east-4</strong> timed out after 30 s.</span>
            </div>
        </div>

        <!-- Data Table -->
        <div class="nc-panel nc-panel--raised rounded-[var(--nc-radius-lg)] p-0 overflow-auto mt-4">
            <table class="nc-table">
                <thead>
                    <tr>
                        <th>Node</th>
                        <th>Status</th>
                        <th>Region</th>
                        <th>CPU</th>
                        <th>Memory</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>node-01</td>
                        <td><span class="nc-badge nc-badge--success">Online</span></td>
                        <td>us-east-1</td>
                        <td class="nc-text-mono">42%</td>
                        <td class="nc-text-mono">3.2 GB</td>
                    </tr>
                    <tr>
                        <td>node-02</td>
                        <td><span class="nc-badge nc-badge--success">Online</span></td>
                        <td>eu-west-2</td>
                        <td class="nc-text-mono">18%</td>
                        <td class="nc-text-mono">1.8 GB</td>
                    </tr>
                    <tr>
                        <td>node-03</td>
                        <td><span class="nc-badge nc-badge--warning">Degraded</span></td>
                        <td>us-west-1</td>
                        <td class="nc-text-mono">91%</td>
                        <td class="nc-text-mono">7.5 GB</td>
                    </tr>
                    <tr>
                        <td>node-04</td>
                        <td><span class="nc-badge nc-badge--error">Offline</span></td>
                        <td>ap-southeast-1</td>
                        <td class="nc-text-muted" colspan="2">—</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </SectionWrapper>
</template>
