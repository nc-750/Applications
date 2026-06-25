# NC-750 constellation — layout, model map, mode map, skill↔agent wiring

The structural contract for the whole constellation. Every role skill and agent follows this.

## Directory layout (repo-scoped)

```
nc750/.pi/
  skills/
    nc-750/                  orchestrator skill (You) — OWNS the shared contracts below
      SKILL.md
      references/            ← THIS folder: the shared contracts every role cites
        skill-agent-wiring.md          (this file)
        master-plan-format.md
        phase-brief-format.md
        challenge-report-format.md
        approval-gate-protocol.md
        env-and-verify.md
    nc-750-ethos-gate/
      SKILL.md
    nc-750-review/
      SKILL.md
    nc-750-plan/
      SKILL.md
    nc-750-master-plan/
      SKILL.md
  agents/
    nc-750-master-plan.md            thin wrapper: model + tools + "follow the skill"
    nc-750-plan.md
    nc-750-review.md
    nc-750-ethos-gate.md
    nc-750-build-frontend-mirror.md
```

You (the orchestrator) own `references/` because it is the composition root. Role skills **cite** these
files (e.g. "emit the brief per `../nc-750/references/phase-brief-format.md`"); they do not restate
the schemas.

## The skill↔agent wiring convention

- **Skill** = doctrine + procedure. It is model-agnostic and has no tools of its own. It answers
  "*how* do I do this role well, and what artifact do I emit."
- **Agent** (`.claude/agents/nc-750-<verb>.md`) = a thin wrapper. Frontmatter pins the **model** and
  a **tool allowlist**; the body is ~3 lines: "You are the NC-750 `<verb>` role. Load and follow the
  `nc-750-<verb>` skill. Produce its artifact for the task in your prompt, then stop and return it."
- The agent **must** include the `Skill` tool so it can load its doctrine. Doctrine is never copied
  into the agent file — single source of truth in the skill.
- The **orchestrator** (`nc-750`, main context) is the only component that spawns agents (via Task)
  and pauses for the user.
