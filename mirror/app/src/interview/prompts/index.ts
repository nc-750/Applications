// Barrel for the interview's LLM I/O contracts. Each flow is one file: its pure
// prompt builders and its boundary schema sit together so a reader can change a
// given LLM behavior in exactly one place. See README.md for the flow map.

export * from "./Fragments";
export * from "./Json";
export * from "./InitialAnalysis"; // Flow 1 — initial-data analysis (chat system prompt)
export * from "./TurnAnalysis"; // Flow 2 — per-turn analysis (Call B)
export * from "./Probe"; // Flow 3 — probe (Call A)
export * from "./Synthesis"; // Flow 4 — synthesis (Call C) + "How I Work Best"
