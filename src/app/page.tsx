'use client';

import { useMemo, useState } from "react";

import { DraftSlideEditor } from "@/components/draft-slide-editor";
import { ReferenceDeckList } from "@/components/reference-deck-list";
import { ReferenceUploader } from "@/components/reference-uploader";
import { createEmptyDraftSlide } from "@/lib/ppt";
import type { DraftSlide, ReferenceDeck } from "@/types/ppt";

const atLeastOneSlideHasContent = (slides: DraftSlide[]) =>
  slides.some((slide) => {
    const hasTitle = slide.title.trim().length > 0;
    const hasBody = slide.body.trim().length > 0;
    const hasBullets = slide.bullets.some((bullet) => bullet.trim().length > 0);
    return hasTitle || hasBody || hasBullets;
  });

export default function Home() {
  const [referenceDecks, setReferenceDecks] = useState<ReferenceDeck[]>([]);
  const [draftSlides, setDraftSlides] = useState<DraftSlide[]>([
    createEmptyDraftSlide(),
  ]);
  const [activeSlideId, setActiveSlideId] = useState<string>(
    draftSlides[0]?.id ?? ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeSlide = useMemo(
    () => draftSlides.find((slide) => slide.id === activeSlideId) ?? null,
    [activeSlideId, draftSlides]
  );

  const handleDecksAdded = (decks: ReferenceDeck[]) => {
    setReferenceDecks((prev) => {
      const existingNames = new Set(prev.map((deck) => deck.fileName));
      const filtered = decks.filter(
        (deck) =>
          !prev.some((existing) => existing.id === deck.id) &&
          !existingNames.has(deck.fileName)
      );
      if (filtered.length === 0) {
        setStatusMessage("These presentations were already imported.");
        return prev;
      }
      setStatusMessage(
        filtered.length === 1
          ? `Loaded ${filtered[0].fileName}`
          : `Loaded ${filtered.length} presentations`
      );
      return [...filtered, ...prev];
    });
  };

  const updateSlide = (slideId: string, nextSlide: DraftSlide) => {
    setDraftSlides((prev) =>
      prev.map((slide) => (slide.id === slideId ? nextSlide : slide))
    );
  };

  const deleteSlide = (slideId: string) => {
    setDraftSlides((prev) => {
      const remaining = prev.filter((slide) => slide.id !== slideId);
      if (remaining.length === 0) {
        const fresh = createEmptyDraftSlide();
        setActiveSlideId(fresh.id);
        return [fresh];
      }

      if (slideId === activeSlideId) {
        setActiveSlideId(remaining[0].id);
      }
      return remaining;
    });
  };

  const addSlide = () => {
    setDraftSlides((prev) => {
      const nextSlide = createEmptyDraftSlide();
      setActiveSlideId(nextSlide.id);
      return [...prev, nextSlide];
    });
  };

  const handleSnippetSelect = (options: {
    deckId: string;
    slideId: string;
    text: string;
  }) => {
    const deck = referenceDecks.find((item) => item.id === options.deckId);
    if (!deck || draftSlides.length === 0) return;

    const ensureActive =
      activeSlide ??
      (() => {
        const firstSlide = draftSlides[0];
        setActiveSlideId(firstSlide.id);
        return firstSlide;
      })();

    const targetSlideId = ensureActive.id;

    setDraftSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== targetSlideId) return slide;

        const trimmedSnippet = options.text.trim();

        const alreadyAttached = slide.references.some(
          (reference) =>
            reference.text.trim() === trimmedSnippet &&
            reference.deckId === deck.id &&
            reference.slideId === options.slideId
        );

        const nextBullets = slide.bullets.some(
          (bullet) => bullet.trim() === trimmedSnippet
        )
          ? slide.bullets
          : slide.bullets.some((bullet) => bullet.trim().length === 0)
          ? slide.bullets.map((bullet, idx) =>
              idx ===
              slide.bullets.findIndex(
                (candidate) => candidate.trim().length === 0
              )
                ? trimmedSnippet
                : bullet
            )
          : [...slide.bullets, trimmedSnippet];

        return {
          ...slide,
          bullets: nextBullets,
          references: alreadyAttached
            ? slide.references
            : [
                ...slide.references,
                {
                  deckId: deck.id,
                  deckName: deck.fileName,
                  slideId: options.slideId,
                  text: trimmedSnippet,
                },
              ],
        };
      })
    );
  };

  const generateDeck = async () => {
    if (!atLeastOneSlideHasContent(draftSlides)) {
      setStatusMessage("Please add some content before generating.");
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const pptx = new PptxGenJS();

      draftSlides.forEach((slide) => {
        const hasTitle = slide.title.trim().length > 0;
        const hasBody = slide.body.trim().length > 0;
        const hasBullets = slide.bullets.some(
          (bullet) => bullet.trim().length > 0
        );

        if (!hasTitle && !hasBody && !hasBullets) return;

        const pptSlide = pptx.addSlide();

        if (hasTitle) {
          pptSlide.addText(slide.title.trim(), {
            x: 0.5,
            y: 0.5,
            fontSize: 32,
            bold: true,
            color: "2E3A59",
          });
        }

        if (hasBody) {
          pptSlide.addText(slide.body.trim(), {
            x: 0.5,
            y: hasTitle ? 1.5 : 0.8,
            w: 8.0,
            fontSize: 20,
            color: "334155",
            lineSpacing: 28,
          });
        }

        if (hasBullets) {
          const filteredBullets = slide.bullets
            .map((bullet) => bullet.trim())
            .filter(Boolean);

          if (filteredBullets.length > 0) {
            pptSlide.addText(
              filteredBullets.map((bullet) => ({
                text: bullet,
                options: { bullet: true },
              })),
              {
                x: 0.75,
                y: hasBody ? 3.0 : hasTitle ? 2.0 : 1.0,
                w: 7.5,
                fontSize: 18,
                color: "1E293B",
                lineSpacing: 28,
              }
            );
          }
        }

        if (slide.notes.trim().length > 0) {
          pptSlide.addNotes(slide.notes.trim());
        }
      });

      const presentationName =
        draftSlides[0]?.title.trim().length > 0
          ? `${draftSlides[0].title.trim().slice(0, 40)}.pptx`
          : "Generated-Presentation.pptx";

      await pptx.writeFile({ fileName: presentationName });
      setStatusMessage("Presentation downloaded successfully.");
    } catch (error) {
      console.error("Failed to build presentation", error);
      setStatusMessage(
        "Something went wrong while generating the PowerPoint. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-12 space-y-4">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            PowerPoint Studio
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Build decks using your reference presentations
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Upload existing PowerPoint files to capture their structure, reuse
            key messaging, and quickly assemble new slides. Everything runs in
            your browser—no files leave your machine.
          </p>
        </header>

        <section className="mb-16 rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-slate-900">
            Upload reference decks
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Import .pptx files to index slide content and inspirational snippets
            before crafting your new presentation.
          </p>
          <div className="mt-6">
            <ReferenceUploader onDecksAdded={handleDecksAdded} />
          </div>
          <div className="mt-8">
            <ReferenceDeckList
              decks={referenceDecks}
              onSnippetSelect={handleSnippetSelect}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Compose your presentation
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Reference snippets add straight into your active slide for rapid
                authoring.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addSlide}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                + Add slide
              </button>
              <button
                type="button"
                onClick={generateDeck}
                disabled={isGenerating}
                className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isGenerating ? "Generating…" : "Generate PowerPoint"}
              </button>
            </div>
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {statusMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {draftSlides.map((slide, index) => (
              <DraftSlideEditor
                key={slide.id}
                slide={slide}
                index={index}
                isActive={slide.id === activeSlideId}
                onSelect={() => setActiveSlideId(slide.id)}
                onChange={(nextSlide) => updateSlide(slide.id, nextSlide)}
                onDelete={() => deleteSlide(slide.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
