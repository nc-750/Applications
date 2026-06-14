// Boundary transforms for the Interview feature (CONVENTIONS 1.5/1.6): the single
// place the domain↔persistence crossing is found and changed. These are called
// only by the feature's db module (`db/InterviewDb.ts`, rule 2.2) — never by the
// store, service, or view.

import type { Interview } from "./models";
import { INTERVIEW_KEY, type InterviewDTO } from "./db/InterviewDb";

/** Domain → persisted DTO: stamp on the per-device key. */
export function toInterviewDTO(interview: Interview): InterviewDTO {
    return { id: INTERVIEW_KEY, ...interview };
}

/** Persisted DTO → domain: drop the persistence key (it never reaches a store/view). */
export function fromInterviewDTO(dto: InterviewDTO): Interview {
    const { id: _id, ...interview } = dto;
    return interview;
}
