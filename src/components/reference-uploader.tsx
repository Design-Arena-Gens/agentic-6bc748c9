import { useCallback, useRef, useState } from "react";

import { analyzePptx } from "@/lib/ppt";
import type { ReferenceDeck } from "@/types/ppt";

type ReferenceUploaderProps = {
  onDecksAdded: (decks: ReferenceDeck[]) => void;
};

const ACCEPTED_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const ReferenceUploader = ({ onDecksAdded }: ReferenceUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;

      setIsLoading(true);
      setError(null);

      try {
        const decks: ReferenceDeck[] = [];

        const candidates = Array.from(files).filter((file) =>
          file.name.toLowerCase().endsWith(".pptx")
        );

        if (candidates.length === 0) {
          setError("Only .pptx files are supported right now.");
          return;
        }

        for (const file of candidates) {
          try {
            const deck = await analyzePptx(file);
            decks.push(deck);
          } catch (err) {
            console.error("Failed to analyse PPTX", err);
            setError(
              `Could not read ${file.name}. Please verify the file is not corrupted.`
            );
          }
        }

        if (decks.length > 0) {
          onDecksAdded(decks);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onDecksAdded]
  );

  const onFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await processFiles(event.target.files);
      event.target.value = "";
    },
    [processFiles]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      await processFiles(event.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        role="presentation"
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50/60"
        }`}
      >
        <p className="text-lg font-semibold text-slate-700">
          Drop PowerPoint files here
        </p>
        <p className="text-sm text-slate-500">
          or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-blue-600 underline underline-offset-4 hover:text-blue-500"
          >
            browse your computer
          </button>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Supported format: .pptx (PowerPoint 2007+)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME}
          multiple
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-600">Processing presentation...</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
