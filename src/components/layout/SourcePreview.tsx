// src/components/SourcePreview.tsx
"use client";

import React, { useCallback, useState } from "react";
import type { QuizQuestion, SourceAnchor } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  question: QuizQuestion | null;
  onRegenerateFromAnchor?: (anchorIndex: number) => void;
  onCopyToPrompt?: (text: string) => void;
};

export default function SourcePreview({ question, onRegenerateFromAnchor, onCopyToPrompt }: Props) {
  const [activeAnchor, setActiveAnchor] = useState<number | null>(null);

  const anchors: SourceAnchor[] = (question?.sourceAnchors ?? []).map((a) => a);

  const handleRegenerate = useCallback((idx: number) => {
    onRegenerateFromAnchor?.(idx);
  }, [onRegenerateFromAnchor]);

  const handleCopy = useCallback((text?: string) => {
    if (!text) return;
    onCopyToPrompt?.(text);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [onCopyToPrompt]);

  if (!question) {
    return (
      <div className="bg-white border rounded p-4 text-sm text-slate-600">
        No question selected.
      </div>
    );
  }

  return (
    <div className="bg-white border rounded p-4 space-y-3">
      <h3 className="text-sm font-medium">Source preview</h3>

      {question.source ? (
        <div className="text-sm text-slate-700 whitespace-pre-wrap">{question.source}</div>
      ) : (
        <div className="text-sm text-slate-500">No source snippet available for this question.</div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-slate-900 mt-2">Anchors</h4>
        {anchors.length === 0 ? (
          <div className="text-xs text-slate-500 mt-2">No anchors available</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {anchors.map((a, idx) => {
              const text = a.text ?? (a.start !== undefined && a.end !== undefined ? `source @ ${a.start}-${a.end}` : "snippet");
              const selected = activeAnchor === idx;
              return (
                <li key={idx} className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex-1 text-sm p-2 rounded",
                      selected ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50"
                    )}
                    onClick={() => setActiveAnchor(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setActiveAnchor(idx); }}
                  >
                    <div className="text-xs text-slate-500">Page: {a.page ?? "—"}</div>
                    <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{text}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => handleCopy(text)}
                      className="text-xs text-slate-600 hover:underline"
                      type="button"
                      aria-label={`Copy anchor ${idx + 1} to prompt`}
                    >
                      Copy
                    </button>

                    <button
                      onClick={() => handleRegenerate(idx)}
                      className="text-xs px-2 py-1 rounded border"
                      type="button"
                      aria-label={`Regenerate from anchor ${idx + 1}`}
                    >
                      Regenerate
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
