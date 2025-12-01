import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

import type {
  DraftSlide,
  ReferenceDeck,
  ReferenceSlideSummary,
} from "@/types/ppt";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  ignorePiTags: true,
  processEntities: true,
});

const collectText = (node: unknown, sink: string[]): void => {
  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed.length > 0) {
      sink.push(trimmed);
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectText(child, sink));
    return;
  }

  if (typeof node === "object" && node !== null) {
    Object.values(node).forEach((value) => collectText(value, sink));
  }
};

const summarizeSnippets = (snippets: string[]): string[] => {
  const trimmed = snippets.map((snippet) => snippet.replace(/\s+/g, " ").trim());
  const uniq = Array.from(new Set(trimmed.filter(Boolean)));
  return uniq.slice(0, 6);
};

export const analyzePptx = async (file: File): Promise<ReferenceDeck> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const idxA = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? "0");
      const idxB = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? "0");
      return idxA - idxB;
    });

  const slides: ReferenceSlideSummary[] = [];

  for (let index = 0; index < slideFiles.length; index += 1) {
    const fileName = slideFiles[index];
    const slideFile = zip.files[fileName];
    const rawXml = await slideFile.async("text");
    let parsed = {};
    try {
      parsed = xmlParser.parse(rawXml);
    } catch (error) {
      console.warn("Failed to parse slide XML", error);
      // ignore parse failures; fallback to regex extraction
    }
    const snippets: string[] = [];
    collectText(parsed, snippets);

    if (snippets.length === 0) {
      for (const match of rawXml.matchAll(/<a:t>(.*?)<\/a:t>/g)) {
        const text = match[1]?.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
        if (text) {
          snippets.push(text);
        }
      }
    }

    slides.push({
      id: crypto.randomUUID(),
      name: `Slide ${index + 1}`,
      order: index + 1,
      textSnippets: summarizeSnippets(snippets),
    });
  }

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileSize: file.size,
    slideCount: slideFiles.length,
    uploadedAt: Date.now(),
    slides,
  };
};

export const createEmptyDraftSlide = (): DraftSlide => ({
  id: crypto.randomUUID(),
  title: "",
  body: "",
  bullets: [""],
  notes: "",
  references: [],
});
