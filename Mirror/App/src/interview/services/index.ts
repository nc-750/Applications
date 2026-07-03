// Barrel for the Interview feature's service layer.
//
// Each concern is one file:
//   Helpers         — pure functions (transcriptOf, mergeCoverage, canConclude, coerceProbe, countQuestionsAsked)
//   Digestion       — needsDigestion check
//   InterviewFlow   — turn-by-turn orchestration (beginInterview, submitAnswer, probeMore, finishEarly, abort)
//   SynthesisBridge — boundary (SynthesisResult) → domain (Persona) transform
//   SynthesisFlow   — end-of-interview synthesis (runSynthesis)
//
// See the Phase 2.5 plan for the full flow map.

export * from "./Helpers";
export * from "./Digestion";
export * from "./InterviewFlow";
export * from "./SynthesisBridge";
export * from "./SynthesisFlow";
