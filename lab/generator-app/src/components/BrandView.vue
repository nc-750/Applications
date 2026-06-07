<script setup lang="ts">
// NC-750 Brand Manifesto — marketing page using document grammar.
// Content derived from brand/VISUAL_IDENTITY.md.
</script>

<template>
  <div class="nc-band">
    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">BRAND</span></div>
        <div class="nc-cell-head__spec">DOC // 0x00</div>
      </div>

      <span class="nc-display block mb-1">NC-750</span>
      <h1 class="nc-heading-2 leading-[1.15] mb-4">
        Software presented as a precision laboratory instrument,<br />
        documented like a technical manual.
      </h1>
      <p class="nc-caption mb-5 max-w-[65ch] leading-relaxed">
        Every NC-750 surface is built from three grammars operating at different scales.
        The <strong>chassis</strong> frames the device on a textured field.
        The <strong>document</strong> layer communicates reality through schematics, spec sheets,
        and the <code class="nc-code">0x00</code> null mark.
        The <strong>instrument</strong> layer makes the interface <em>operated</em> — measuring,
        acquiring, certifying — rather than browsed.
      </p>
      <div class="flex items-center gap-3">
        <button class="nc-btn nc-btn--accent">Read the constitution ▸</button>
        <button class="nc-btn nc-btn--secondary">Explore the Lab</button>
      </div>
    </div>
  </div>

  <div class="nc-band">
    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">PRODUCT FAMILY</span></div>
        <div class="nc-cell-head__spec">DOC // 0x01</div>
      </div>
      <div class="nc-plate">
        <div class="flex items-start justify-center gap-6 flex-wrap">
          <div class="nc-schematic-box min-w-[160px]">
            <div class="nc-schematic-box__label">NODE-XX</div>
            <div class="nc-schematic-box__name">Software</div>
            <p class="nc-caption mt-2 leading-snug text-[var(--nc-ink-2)]">
              Full three-grammar expression.<br />Mirror is the reference —<br />an instrument, not a chat.
            </p>
          </div>
          <div class="nc-path w-8 self-center mt-[-24px] hidden sm:block" />
          <div class="nc-schematic-box min-w-[160px]">
            <div class="nc-schematic-box__label">UNIT-XX</div>
            <div class="nc-schematic-box__name">Hardware</div>
            <p class="nc-caption mt-2 leading-snug text-[var(--nc-ink-2)]">
              Chassis and document grammars<br />are literal — stamped chassis,<br />etched part numbers.
            </p>
          </div>
          <div class="nc-path w-8 self-center mt-[-24px] hidden sm:block" />
          <div class="nc-schematic-box min-w-[160px]">
            <div class="nc-schematic-box__label">CORE-XX</div>
            <div class="nc-schematic-box__name">Infrastructure</div>
            <p class="nc-caption mt-2 leading-snug text-[var(--nc-ink-2)]">
              Document grammar — specs,<br />schematics, logs. The layer<br />with no consumer UI.
            </p>
          </div>
        </div>
        <div class="nc-null inline-flex mt-4">0x00</div>
      </div>
    </div>

    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">THREE GRAMMARS</span></div>
        <div class="nc-cell-head__spec">DOC // 0x02</div>
      </div>
      <div class="nc-plate flex flex-col gap-4">
        <div>
          <span class="nc-label text-[var(--nc-accent-ink)]">Chassis</span>
          <p class="nc-caption mt-1 leading-snug">
            The framed device that sits on the page. A textured background field,
            dark header and footer, panels joined by 1px seams. Always present, never broken.
          </p>
        </div>
        <div>
          <span class="nc-label text-[var(--nc-accent-ink)]">Document</span>
          <p class="nc-caption mt-1 leading-snug">
            Schematics, spec sheets, dimension lines, callouts, part numbers, and the
            0x00 null mark. Communicates reality — proves claims — instead of selling.
          </p>
        </div>
        <div>
          <span class="nc-label text-[var(--nc-accent-ink)]">Instrument</span>
          <p class="nc-caption mt-1 leading-snug">
            Measurements, not conversations. Saturation, not counters.
            Acquisition, not spinners. Products are operated like instruments — not browsed like apps.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="nc-band">
    <div class="nc-cell nc-cell--grow-2">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">FOUNDING PRINCIPLES</span></div>
        <div class="nc-cell-head__spec">DOC // 0x03</div>
      </div>
      <div class="nc-table-wrapper">
        <table class="nc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Principle</th>
              <th>Status</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="nc-text-mono">P1</td>
              <td class="font-medium">Structural not chromatic</td>
              <td><span class="nc-badge nc-badge--success">CERTIFIED</span></td>
              <td class="nc-caption">Identity is carried by seams, density, recession — not by any particular colour.</td>
            </tr>
            <tr>
              <td class="nc-text-mono">P2</td>
              <td class="font-medium">Containment</td>
              <td><span class="nc-badge nc-badge--success">CERTIFIED</span></td>
              <td class="nc-caption">Content sits inside a chassis with a textured field. Never floats on the canvas.</td>
            </tr>
            <tr>
              <td class="nc-text-mono">P3</td>
              <td class="font-medium">Seams not shadows</td>
              <td><span class="nc-badge nc-badge--success">CERTIFIED</span></td>
              <td class="nc-caption">1px seams and tonal shifts. No drop-shadows, no glow-as-elevation.</td>
            </tr>
            <tr>
              <td class="nc-text-mono">P4</td>
              <td class="font-medium">Recession holds content</td>
              <td><span class="nc-badge nc-badge--success">CERTIFIED</span></td>
              <td class="nc-caption">Diagrams and readouts live on recessed drafting plates. Chrome on raised panels.</td>
            </tr>
            <tr>
              <td class="nc-text-mono">P6</td>
              <td class="font-medium">Instrument over app</td>
              <td><span class="nc-badge nc-badge--accent">ACTIVE</span></td>
              <td class="nc-caption">Interface is operated, not used. Favour readouts, probes, acquisition states.</td>
            </tr>
            <tr>
              <td class="nc-text-mono">P8</td>
              <td class="font-medium">One loud signal</td>
              <td><span class="nc-badge nc-badge--success">CERTIFIED</span></td>
              <td class="nc-caption">Accent marks action, selection, focus — and nothing else. ≤10% of any screen.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">MUST NEVER FEEL LIKE</span></div>
        <div class="nc-cell-head__spec">DOC // 0x04</div>
      </div>
      <div class="nc-plate">
        <ul class="flex flex-col gap-2 pl-0 list-none m-0">
          <li class="flex items-center gap-2">
            <span class="nc-badge nc-badge--error">X</span>
            <span class="nc-caption">SaaS dashboard (hero metric + sparkline cards)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="nc-badge nc-badge--error">X</span>
            <span class="nc-caption">Hacker terminal (CRT, scanlines, &gt;_ prompt)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="nc-badge nc-badge--error">X</span>
            <span class="nc-caption">Crypto / web3 network graph (node‑and‑edge decoration)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="nc-badge nc-badge--error">X</span>
            <span class="nc-caption">Marketing landing page (gradient washes, glass cards)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="nc-badge nc-badge--error">X</span>
            <span class="nc-caption">Chat client (bubble transcript as the main object)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="nc-badge nc-badge--error">X</span>
            <span class="nc-caption">Material / Bootstrap (elevation shadows, ripples, FABs)</span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="nc-band">
    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">CERTIFICATION</span></div>
        <div class="nc-cell-head__spec">DOC // 0x05</div>
      </div>
      <div class="nc-plate flex flex-col items-center gap-3 py-6">
        <div class="nc-divider w-full" />
        <span class="nc-null text-2xl font-bold">0x00</span>
        <p class="nc-caption text-center max-w-[45ch] leading-relaxed">
          Zero tracking. Zero accounts. Zero retention. Every claim is verifiable.
        </p>
        <div class="nc-dimension w-full max-w-[240px]">
          <span class="nc-partno">ZERO STATE</span>
          <div class="nc-dimension__line" />
          <span class="nc-partno">VERIFIED</span>
        </div>
        <div class="nc-reg inline-flex" />
        <div class="nc-divider w-full" />
      </div>
    </div>

    <div class="nc-cell">
      <div class="nc-cell-head">
        <div class="nc-cell-head__title"><span class="nc-label">BUILD WITH THE LAB</span></div>
        <div class="nc-cell-head__spec">DOC // 0x06</div>
      </div>
      <div class="nc-plate flex flex-col gap-4">
        <p class="nc-caption leading-relaxed">
          The Lab design system is open. Seed-driven, themeable, WCAG-AA.
          Every visual decision flows through six channel variables — change the
          seeds, retheme the entire system.
        </p>
        <div class="flex items-center gap-3 flex-wrap">
          <button class="nc-btn nc-btn--accent">Explore the design system ▸</button>
          <button class="nc-btn nc-btn--secondary">Read DESIGN.md</button>
        </div>
        <hr class="nc-divider" />
        <div class="flex items-center gap-4 flex-wrap text-[var(--nc-ink-2)] text-xs">
          <span class="nc-partno">SEED-DRIVEN</span>
          <span class="nc-partno">THEMEABLE</span>
          <span class="nc-partno">WCAG-AA</span>
          <span class="nc-partno">ZERO-COPY CSS</span>
        </div>
      </div>
    </div>
  </div>
</template>
