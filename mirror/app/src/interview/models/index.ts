export * from "./Interview";

// The transcript line type lives in `core` (shared with persona) but is part of
// the interview model surface — re-export so `from "../models"` keeps resolving.
export type { TranscriptMessage } from "../../core/Transcript";
export { createTranscriptMessage } from "../../core/Transcript";
