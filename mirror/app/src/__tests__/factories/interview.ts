import type { InterviewRecord } from "../../db/schema";

export function activeInterview(overrides?: Partial<InterviewRecord>): InterviewRecord {
  return {
    id: "default",
    status: "active",
    initialData: "Brief summary of the candidate...",
    inputText: "Raw text from data input...",
    uploadedFileNames: ["resume.pdf"],
    wasDigested: false,
    messages: [
      {
        role: "assistant",
        content: "Hi! Tell me about yourself.",
        timestamp: "2026-01-15T10:00:00.000Z",
      },
      {
        role: "user",
        content: "I am a developer with 5 years of experience.",
        timestamp: "2026-01-15T10:00:30.000Z",
      },
    ],
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:30.000Z",
    ...overrides,
  };
}

export function synthesizingInterview(): InterviewRecord {
  return activeInterview({ status: "synthesizing" });
}

export function completedInterview(): InterviewRecord {
  return activeInterview({
    status: "completed",
    messages: [
      ...activeInterview().messages,
      {
        role: "assistant",
        content:
          "Great, I have everything I need.<<INTERVIEW_COMPLETE>>",
        timestamp: "2026-01-15T10:05:00.000Z",
      },
    ],
  });
}

export function errorInterview(): InterviewRecord {
  return activeInterview({
    status: "error",
    synthesisError: "Extract phase — identity.name: Required",
  });
}

/** An interview with many chat turns, simulating a full pro-tier conversation. */
export function longInterview(): InterviewRecord {
  const messages = [
    { role: "assistant" as const, content: "Welcome! Let's start by exploring your background. Can you walk me through your current role?", timestamp: "2026-01-15T10:00:00.000Z" },
    { role: "user" as const, content: "I'm a Staff Engineer at StartupX, leading the platform team. We build the core infrastructure that powers our customer-facing products.", timestamp: "2026-01-15T10:01:00.000Z" },
    { role: "assistant" as const, content: "What's been the most challenging technical decision you've had to make in that role?", timestamp: "2026-01-15T10:01:30.000Z" },
    { role: "user" as const, content: "Choosing between building on Kubernetes or going serverless. We went with K8s for flexibility, but it meant a steep learning curve for the team.", timestamp: "2026-01-15T10:02:00.000Z" },
    { role: "assistant" as const, content: "Let's go deeper on that. How did you handle the team's learning curve?", timestamp: "2026-01-15T10:02:30.000Z" },
    { role: "user" as const, content: "I set up weekly pairing sessions and created an internal knowledge base. Within 3 months, everyone could deploy independently.", timestamp: "2026-01-15T10:03:00.000Z" },
    { role: "assistant" as const, content: "Shifting gears — what's something you do outside of work that shapes how you approach problems?", timestamp: "2026-01-15T10:03:30.000Z" },
    { role: "user" as const, content: "I maintain a VS Code extension with 10k+ users. It taught me a lot about API design and managing an open-source community.", timestamp: "2026-01-15T10:04:00.000Z" },
    { role: "assistant" as const, content: "That's fascinating. What's the hardest part of maintaining a popular extension?", timestamp: "2026-01-15T10:04:30.000Z" },
    { role: "user" as const, content: "Saying no to feature requests. You can't please everyone, so you have to stay focused on the core value proposition.", timestamp: "2026-01-15T10:05:00.000Z" },
    { role: "assistant" as const, content: "Last question — where do you see yourself in 5 years?", timestamp: "2026-01-15T10:05:30.000Z" },
    { role: "user" as const, content: "I want to move into a CTO or technical founder role. I'm already practicing the strategic thinking, but I need more experience with fundraising and go-to-market.", timestamp: "2026-01-15T10:06:00.000Z" },
    { role: "assistant" as const, content: "That's comprehensive. I have everything I need.<<INTERVIEW_COMPLETE>>", timestamp: "2026-01-15T10:06:30.000Z" },
  ];

  return {
    id: "default",
    status: "active",
    initialData: "Staff Engineer at StartupX with 8 years of experience...",
    inputText: "I'm a Staff Engineer...",
    uploadedFileNames: ["resume.pdf", "portfolio.md"],
    wasDigested: false,
    messages,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:06:30.000Z",
  };
}
