import { isWithinTokenLimit } from "tokenx";
import { AttachedFile } from "../../fileManager/services/fileExtractor";
import { getContextWindowLimit } from "../reference";
import { Message } from "@nc-750/llm-ts";

export function isDigestionNeeded(attachedFiles: AttachedFile[], userInput: string, model: string) {
    const filesConcatData = attachedFiles.map((file) => `${file.name} ${file.text}`).join("\n");
    const data = `${filesConcatData}\n\n${userInput}`;
    const contextWindowLimit = getContextWindowLimit(model);

    return isWithinTokenLimit(data, contextWindowLimit);
}

export function digestData(messages: Message[]) {
    // TODO: Implement
}