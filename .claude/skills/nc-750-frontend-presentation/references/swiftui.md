# Target: swiftui — NOT YET AUTHORED

**Status: stub.** There is no concrete SwiftUI implementation contract for the Lab design system yet.

This module is a placeholder so the master skill's structure is ready for a SwiftUI target. Until it
is authored:

- The **platform-agnostic instrument philosophy in `SKILL.md` still fully applies** — the three
  grammars (chassis / document / instrument), the instrument stance, the Chassis → Band → Cell
  mental model, seams-not-shadows, recession-holds-content, the one-loud-signal rule, the
  honest-reading rule (no fake meters), and "a monitor is read-only, never input."
- There is **no sanctioned SwiftUI vocabulary** — no `View` catalogue, no equivalent of the `.nc-*`
  classes or the `@nc-750/lab-vue` component surface, no layout-utility rule. **Do not invent one,
  and do not port the web target's vocabulary onto SwiftUI.**
- If asked to build or review a SwiftUI NC-750 surface: say plainly that the **swiftui target is not
  yet authored**, then either reason from the platform-agnostic principles alone (making the
  mapping-to-SwiftUI choices explicit and provisional) or stop and ask the user how to proceed.

<!-- TODO: author the SwiftUI contract — the View surface that realises Chassis/Band/Cell/
     MonitorCell, the layout-vocabulary rule (the SwiftUI analogue of "Tailwind inside a Cell"),
     the token/theme binding (the analogue of the .nc-* / CSS-custom-property system), the
     instrument views (Facet / Coverage / Acquire / SessionLog analogues), and a before/after. -->
