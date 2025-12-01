export type ReferenceSlideSummary = {
  id: string;
  name: string;
  order: number;
  textSnippets: string[];
};

export type ReferenceDeck = {
  id: string;
  fileName: string;
  fileSize: number;
  slideCount: number;
  uploadedAt: number;
  slides: ReferenceSlideSummary[];
};

export type DraftSlide = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  notes: string;
  references: {
    deckId: string;
    deckName: string;
    slideId: string | null;
    text: string;
  }[];
};
