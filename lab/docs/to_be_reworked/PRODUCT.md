# Product

## Register

product

## Users

Design system authors — developers and designers building their own component libraries or design systems. They value a well-architected reference implementation with clean token structure and clear extensibility patterns. They are not looking for a drop-in Bootstrap replacement; they want a starting point with a distinctive aesthetic they can adapt and build upon.

Their context: they have a project (greenfield app, internal tool, SaaS product) and want a UI that doesn't read as "yet another Tailwind app." They need the design system to be production-ready in its CSS architecture while being visually distinctive enough to serve as a foundation for their own brand.

## Product Purpose

Lab is a reference design system that captures the "Tactile Industrial Hardware" aesthetic — the surgical, panel-based, seam-separated style found in Nothing OS and Teenage Engineering interfaces. It provides a complete, token-driven CSS component library (all classes prefixed `nc-`) that can be dropped into any project and customized through CSS custom properties.

The cheatsheet page serves as both documentation and a visual proof: every component is shown in context, with explanations of the design rationale.

## Brand Personality

**Surgical, industrial, calm.** The interface should feel like a precision instrument. Every pixel is intentional; decoration that means nothing is removed, and what remains earns its place. The UI equivalent of a well-machined aluminum enclosure — cool to the touch, precisely toleranced, confident in its restraint — yet a live device, not a static poster: it reacts, changes state, and is operated by the user, who leads.

## Anti-references

- **Over-designed / decorative**: No gradients, no glassmorphism, no excessive animation, no box shadows for elevation. The system should feel like precision hardware, not a design portfolio piece.
- **Material Design**: No floating cards, no FABs, no ripple effects, no elevation-based hierarchy. Shadows are not a separation mechanism.
- **Generic SaaS template *patterns***: not the busy-decoration pattern of hero-metric dashboards, icon-above-heading card grids, or purple-to-blue gradients. The *pattern* is rejected, not the shape — an honest many-metric surface a task genuinely needs is fine, integrated into the grammar (see `../brand/VISUAL_IDENTITY.md §4`). If it looks like every startup landing page, it's wrong.
- **Brutalist / raw**: Industrial does not mean crude. The system is precise and considered, not deliberately rough or confrontational.

## Design Principles

1. **Seams, not shadows.** Panels separate through 1px borders and surface-level brightness shifts. No box-shadow elevation. The interface feels assembled from physical panels that meet at seams.

2. **Every pixel intentional.** Decoration that means nothing is removed — if a line, color, or space doesn't serve the user's task, it goes. This is not asceticism: a dynamic, tactile, or warm detail that *does* serve the task or honestly signals a live state is welcome (see `../brand/VISUAL_IDENTITY.md` P2/P9). Calm comes from absence of noise, not absence of life.

3. **Hardware honesty.** The interface should feel like a physical instrument — anodized aluminum, precisely machined, cool and confident. Typography, spacing, and color should evoke industrial precision, not print design.

4. **Tokens are the API.** Every visual decision flows through CSS custom properties on `:root`. Components reference tokens exclusively. Customization means overriding variables, not fighting specificity. The system is designed to be extended and rebranded.

5. **Density with calm.** High information capacity without visual noise. Surgical whitespace. Tight typography with breathing room between sections. The user should feel capable, not overwhelmed.

## Accessibility & Inclusion

Target: WCAG 2.1 AA. All interactive elements must have visible focus indicators, sufficient color contrast (minimum 4.5:1 for text, 3:1 for large text and UI components), and keyboard-navigable interactions. The `prefers-reduced-motion` media query should disable non-essential transitions.
