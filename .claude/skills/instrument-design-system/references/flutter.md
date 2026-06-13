# Target: flutter — NOT YET AUTHORED

**Status: stub.** There is no concrete Flutter implementation contract for the Lab design system yet.

This module is a placeholder so the master skill's structure is ready for a Flutter target. Until it
is authored:

- The **platform-agnostic instrument philosophy in `SKILL.md` still fully applies** — the three
  grammars (chassis / document / instrument), the instrument stance, the Chassis → Band → Cell
  mental model, seams-not-shadows, recession-holds-content, the one-loud-signal rule, the
  honest-reading rule (no fake meters), and "a monitor is read-only, never input."
- There is **no sanctioned Flutter vocabulary** — no widget catalogue, no equivalent of the `.nc-*`
  classes or the `@nc-750/lab-vue` component surface, no layout-utility rule. **Do not invent one,
  and do not port the web target's vocabulary onto Flutter.**
- If asked to build or review a Flutter NC-750 surface: say plainly that the **flutter target is not
  yet authored**, then either reason from the platform-agnostic principles alone (making the
  mapping-to-Flutter choices explicit and provisional) or stop and ask the user how to proceed.

<!-- TODO: author the Flutter contract — the widget surface that realises Chassis/Band/Cell/
     MonitorCell, the layout-vocabulary rule (the Flutter analogue of "Tailwind inside a Cell"),
     the token/theme binding (the analogue of the .nc-* / CSS-custom-property system), the
     instrument widgets (Facet / Coverage / Acquire / SessionLog analogues), and a before/after. -->
