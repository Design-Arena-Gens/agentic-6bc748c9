import { Fragment } from "react";

import type { DraftSlide } from "@/types/ppt";

type DraftSlideEditorProps = {
  slide: DraftSlide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onChange: (next: DraftSlide) => void;
  onDelete: () => void;
};

export const DraftSlideEditor = ({
  slide,
  index,
  isActive,
  onSelect,
  onChange,
  onDelete,
}: DraftSlideEditorProps) => {
  const handleBulletChange = (value: string, bulletIndex: number) => {
    const nextBullets = slide.bullets.slice();
    nextBullets[bulletIndex] = value;
    onChange({ ...slide, bullets: nextBullets });
  };

  const handleAddBullet = () => {
    onChange({ ...slide, bullets: [...slide.bullets, ""] });
  };

  const handleRemoveBullet = (bulletIndex: number) => {
    const nextBullets = slide.bullets.filter((_, idx) => idx !== bulletIndex);
    onChange({ ...slide, bullets: nextBullets.length > 0 ? nextBullets : [""] });
  };

  return (
    <article
      className={`rounded-xl border p-4 transition ${
        isActive
          ? "border-blue-400 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:shadow"
      }`}
    >
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="text-left"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Slide {index + 1}
          </h3>
          <p className="text-lg font-semibold text-slate-800">
            {slide.title || "Untitled Slide"}
          </p>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-300 hover:bg-red-100"
        >
          Remove
        </button>
      </header>

      {isActive ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={slide.title}
              onChange={(event) =>
                onChange({ ...slide, title: event.target.value })
              }
              placeholder="Add a compelling headline"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Supporting text
            </label>
            <textarea
              className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={slide.body}
              onChange={(event) =>
                onChange({ ...slide, body: event.target.value })
              }
              placeholder="Optional narrative paragraph"
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Key bullet points
            </label>
            <div className="space-y-2">
              {slide.bullets.map((bullet, bulletIndex) => (
                <Fragment key={`${slide.id}-bullet-${bulletIndex}`}>
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={bullet}
                      onChange={(event) =>
                        handleBulletChange(event.target.value, bulletIndex)
                      }
                      placeholder="Add a bullet or leave empty to omit"
                    />
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-red-300 hover:text-red-500"
                      onClick={() => handleRemoveBullet(bulletIndex)}
                    >
                      Delete
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-500"
              onClick={handleAddBullet}
            >
              + Add bullet
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Presenter notes
            </label>
            <textarea
              className="h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={slide.notes}
              onChange={(event) =>
                onChange({ ...slide, notes: event.target.value })
              }
              placeholder="Optional notes for the presenter"
            />
          </div>
          {slide.references.length > 0 ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
              <p className="font-semibold text-blue-700">
                Reference snippets attached:
              </p>
              <ul className="mt-1 space-y-2">
                {slide.references.map((reference) => (
                  <li
                    key={`${slide.id}-${reference.deckId}-${reference.slideId}-${reference.text}`}
                    className="rounded bg-white px-3 py-2 text-slate-600 shadow-sm"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">
                      {reference.deckName}
                      {reference.slideId ? " • Slide reference" : " • Summary"}
                    </p>
                    <p>{reference.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
