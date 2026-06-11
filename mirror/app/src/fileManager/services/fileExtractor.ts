/**
 * Extracts plain text from uploaded files.
 * Supported: .txt, .md/.markdown, .html/.htm, .pdf, .json
 *
 * PDF.js is lazy-loaded only when a PDF is first processed,
 * so it doesn't bloat the initial bundle.
 */

export interface AttachedFile {
  name: string;
  text: string;
}

export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".markdown", ".html", ".htm", ".pdf", ".json"];

export const ACCEPT_STRING = ACCEPTED_EXTENSIONS.join(",");

export function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Extract plain text from any supported file. Throws on unsupported type. */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractPDF(file);
  }
  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return extractHTML(file);
  }
  if (name.endsWith(".json")) {
    return extractJSON(file);
  }
  // .txt, .md, .markdown — already plain text
  return file.text();
}

// ── PDF (lazy) ────────────────────────────────────────────────────────────────

let pdfjsLoaded = false;

async function ensurePDFJS() {
  if (pdfjsLoaded) return;
  const pdfjsLib = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  pdfjsLoaded = true;
}

async function extractPDF(file: File): Promise<string> {
  await ensurePDFJS();
  const pdfjsLib = await import("pdfjs-dist");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n");
}

// ── JSON ──────────────────────────────────────────────────────────────────────

async function extractJSON(file: File): Promise<string> {
  const raw = await file.text();
  try {
    return JSON.stringify(JSON.parse(raw));
  } catch {
    // Not valid JSON — pass through as-is
    return raw;
  }
}

// ── HTML ──────────────────────────────────────────────────────────────────────

async function extractHTML(file: File): Promise<string> {
  const raw = await file.text();
  const doc = new DOMParser().parseFromString(raw, "text/html");

  // Drop noise nodes
  doc.querySelectorAll("script, style, noscript, head").forEach((el) => el.remove());

  // Prefer block-level text nodes for structured output
  const blocks = Array.from(
    doc.body?.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre"
    ) ?? []
  )
    .map((el) => el.textContent?.trim())
    .filter(Boolean) as string[];

  if (blocks.length) return blocks.join("\n\n");

  // Fallback to full body text
  return doc.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}
