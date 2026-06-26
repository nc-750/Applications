export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogCategory =
  | "app"
  | "llm"
  | "store"
  | "keyring"
  | "license"
  | "settings"
  | "synthesis"
  | "import"
  | "export"
  | "wipe"
  | "system"
  | "feedback";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  stack?: string;
}
