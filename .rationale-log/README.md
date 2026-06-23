# Rationale-Log Experiment — Test Plan & Capture Setup

The one question this experiment answers:

> Does traversing captured rationale recover a why that you couldn't have
> reconstructed from the diff, git log, and your issue tracker — or only the
> technical why that was already sitting in the diff?

Everything below is built to answer that cheaply and without fooling yourself.

## Abandoning condition

After ~3 weeks, I will pick 10 moments where I genuinely asked "why is this
like this?" during normal work. For each, I check two things: (a) did the
rationale chain answer it? and (b) could git log + the diff + my issue
tracker have answered it just as well? If the chain only ever tells me things
the diff already showed, the idea is not earning its keep and I stop.

## Test process

While you work (a few weeks)

1. Work normally — Claude Code plus your manual review, exactly as you do
now. Don't change how you develop. The experiment rides along; it isn't the work.

2. The agent writes a node per decision. At the end of each unit of work that
involved a real decision, the agent appends one JSON file to .rationale-log/.
These are tagged agent_inferred by construction — they are the agent's own
account of its reasoning.

3. Do NOT improve the agent's rationale. This is the discipline the whole
experiment depends on. If you quietly polish every agent rationale into something
better, you are testing a curated system that won't exist in production — where
the agent runs unattended. Leave agent nodes exactly as written, however thin.
Their as-written quality is the thing being measured.

4. Add a human rationale ONLY when you hold one the agent couldn't. When you
know a why that wasn't visible to the agent — a deadline, a constraint, a
vendor relationship, a "didn't want to touch that yet," a socio-political reason
— write it into that node's human_rationale field. Only when you actually have
one. Never manufacture it to look thorough.

5. Link nodes during review. The agent leaves derived_from empty; you fill
it from memory, connecting each node to the decision(s) it followed from. Note
when this linking required hindsight the nodes themselves didn't contain. That
reaching-into-memory is a finding: it's the gap between what gets captured and
what's needed to make capture useful, and it looks free in a hand-run test while
being the whole problem in production.

6. Watch the alternative_not_taken field. If it keeps coming back empty or
"none — obvious," that's information, not a defect: either the work genuinely had
no forks (terse is correct) or the capture is too thin to surface them. Don't
push the agent to invent alternatives — manufactured forks poison the log with
noise.

7. Note the tedium, honestly, especially the first few times. "How heavy was
honest capture, for a motivated human, on a project they care about" is one of
your real results — and it's only legible now, before you've either built
tooling to hide it or habituated to it. If even this is too heavy to sustain for
three weeks, that is itself the experiment answering whether unattended capture is
viable at all.


After ~3 weeks

8. Run the abandon check you wrote in step 1: 10 real questions, chain versus
diff-baseline.

9. Compute the value split. Of the rationales that turned out genuinely
useful on review, what fraction were human_rationale (only you could supply)
versus agent_inferred (the agent captured unattended)?


If almost all the value is in the human-supplied ones → the auto-capture wedge
is thin, and the real tool is "a low-friction way to attach a why a human
already holds." Smaller, possibly still good, but a different product.
If meaningful value shows up in the agent-supplied ones → the wedge is real and
the bet is reachable.


10. Decide. Does recovered why beat the diff, and where does the value
actually live? That's the whole result. You don't need to build anything else to
get it.

## What you are deliberately NOT building

No append-with-cycle-check, no hash chain, no snapshots, no UUIDv7, no database,
no query engine, no graph library. A directory of JSON files and a twenty-line
script that loads them and walks derived_from backward is the entire apparatus.

If you find yourself building any of the above before you have an answer, you've
slipped from testing the idea back into building the system — the one thing to
avoid until the answer is yes.

A reading script is all you need on the analysis side — roughly:

load every .json in .rationale-log/
given a node id, follow derived_from backwards, print each node's
  decision / rationale / human_rationale in order

  