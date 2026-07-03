// Tuning constants and protocol tokens for the interview's coverage reading.
// Reference data, not a domain model (CONVENTIONS 1.2 / 6.10).

/** A facet meter reads "locked" (green) at or above this saturation. */
export const SATURATION_LOCKED = 0.8;

/** The interview concludes once every facet reaches this saturation. */
export const CONCLUDE_THRESHOLD = 0.75;

/** Floor — the interview never finishes below this many questions. */
export const MIN_QUESTIONS = 5;

/** Hard backstop — the interview offers to conclude here even if facets are short of target. */
export const MAX_QUESTIONS = 15;

/** Emitted by the model when the interview is over; detected by the app to
 *  trigger the synthesis call. Kept distinctive so it can't collide with prose. */
export const INTERVIEW_COMPLETE_SENTINEL = "<<INTERVIEW_COMPLETE>>";
