// Factory
export { createLLMClient } from "./src/client";

// Types
export type {
  ProviderKind,
  KeyProvider,
  ContentPart,
  TextPart,
  ImagePart,
  AudioPart,
  Message,
  MessageInput,
  StreamOptions,
  MessageOptions,
  StructuredDef,
  LLMClientConfig,
  LLMClient,
  Result,
  Ok,
  Err,
} from "./src/types";

// Error types
export { LLMError } from "./src/types";

// Error utilities
export { normalizeError, sanitize } from "./src/errors";
