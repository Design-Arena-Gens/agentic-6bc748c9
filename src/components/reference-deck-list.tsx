import { useState } from "react";

import type { ReferenceDeck, ReferenceSlideSummary } from "@/types/ppt";

type Props = {
  decks: ReferenceDeck[];
  onSnippetSelect?: (context: {
    deckId: string;
    slideId: string;
    text: string;
  }) => void;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
};

const SlideSummary = ({
  deckId,
  slide,
  isExpanded,
  onSnippetSelect,
}: {
  deckId: string;
  slide: ReferenceSlideSummary;
  isExpanded: boolean;
  onSnippetSelect?: Props["onSnippetSelect"];
}) => (
  <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-700">{slide.name}</p>
        <p className="text-xs text-slate-500">
          {slide.textSnippets.length} snippet
          {slide.textSnippets.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
    {isExpanded && slide.textSnippets.length > 0 ? (
      <ul className="mt-3 space-y-2">
        {slide.textSnippets.map((snippet, idx) => (
          <li
            key={`${slide.id}-${idx}`}
            className="rounded border border-slate-200 bg-slate-50 p-2 text-xs leading-relaxed text-slate-600"
          >
            <div className="flex justify-between gap-3">
              <span className="flex-1">{snippet}</span>
              {onSnippetSelect ? (
                <button
                  type="button"
                  className="shrink-0 rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-500"
                  onClick={() =>
                    onSnippetSelect({
                      deckId,
                      slideId: slide.id,
                      text: snippet,
                    })
                  }
                >
                  Use
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

export const ReferenceDeckList = ({ decks, onSnippetSelect }: Props) => {
  const [expandedDecks, setExpandedDecks] = useState<string[]>([]);
  const [expandedSlides, setExpandedSlides] = useState<string[]>([]);

  if (decks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No reference presentations uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {decks
        .slice()
        .sort((a, b) => b.uploadedAt - a.uploadedAt)
        .map((deck) => {
          const isDeckExpanded = expandedDecks.includes(deck.id);
          return (
            <article
              key={deck.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {deck.fileName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatBytes(deck.fileSize)} • {deck.slideCount} slide
                    {deck.slideCount === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600"
                  onClick={() =>
                    setExpandedDecks((prev) =>
                      prev.includes(deck.id)
                        ? prev.filter((id) => id !== deck.id)
                        : [...prev, deck.id]
                    )
                  }
                >
                  {isDeckExpanded ? "Hide slides" : "Show slides"}
                </button>
              </header>

              {isDeckExpanded ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {deck.slides.map((slide) => {
                    const isSlideExpanded = expandedSlides.includes(slide.id);
                    return (
                      <div key={slide.id} className="space-y-2">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() =>
                            setExpandedSlides((prev) =>
                              prev.includes(slide.id)
                                ? prev.filter((id) => id !== slide.id)
                                : [...prev, slide.id]
                            )
                          }
                        >
                          <span>{slide.name}</span>
                          <span className="text-xs text-slate-500">
                            {isSlideExpanded ? "Collapse" : "Expand"}
                          </span>
                        </button>
                        <SlideSummary
                          deckId={deck.id}
                          slide={slide}
                          isExpanded={isSlideExpanded}
                          onSnippetSelect={onSnippetSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
    </div>
  );
};
