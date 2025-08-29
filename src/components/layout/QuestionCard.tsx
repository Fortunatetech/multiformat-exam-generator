// src/components/QuestionCard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/api";

export type QuestionCardProps = {
  question: QuizQuestion;
  index?: number; // optional display index
  onSave?: (q: QuizQuestion) => Promise<void> | void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  showSource?: boolean;
  className?: string;
};

export default function QuestionCard({
  question,
  index,
  onSave,
  onAccept,
  onReject,
  onRegenerate,
  showSource = true,
  className,
}: QuestionCardProps) {
  // local editable copy
  const [local, setLocal] = useState<QuizQuestion>(question);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // sync when parent question changes (e.g., new generation)
  useEffect(() => setLocal(question), [question]);

  const isMCQ = local.type === "mcq";
  const isTF = local.type === "tf";

  const updateField = useCallback(<K extends keyof QuizQuestion>(key: K, value: QuizQuestion[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateChoice = useCallback((idx: number, value: string) => {
    setLocal((prev) => {
      const choices = prev.choices ? [...prev.choices] : [];
      choices[idx] = value;
      return { ...prev, choices };
    });
  }, []);

  const addChoice = useCallback(() => {
    setLocal((prev) => ({ ...prev, choices: [...(prev.choices ?? []), "New option"] }));
  }, []);

  const removeChoice = useCallback((idx: number) => {
    setLocal((prev) => {
      const choices = prev.choices ? prev.choices.filter((_, i) => i !== idx) : [];
      // if answer was an index or string ensure answer stays valid
      return { ...prev, choices };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave) {
      setStatusMessage("Saved (local)");
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await onSave(local);
      setStatusMessage("Saved");
      setEditing(false);
    } catch (err: any) {
      setStatusMessage(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 2000);
    }
  }, [local, onSave]);

  const handleAccept = useCallback(() => {
    onAccept?.(local.id);
  }, [local.id, onAccept]);

  const handleReject = useCallback(() => {
    onReject?.(local.id);
  }, [local.id, onReject]);

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(local.id);
  }, [local.id, onRegenerate]);

  const renderChoices = useMemo(() => {
    if (!local.choices || local.choices.length === 0) return null;
    return (
      <ul className="space-y-2 mt-2">
        {local.choices.map((c, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 text-xs text-slate-600 mt-1">{String.fromCharCode(65 + i)}.</div>
            <div className="flex-1">
              {editing ? (
                <div className="flex gap-2 items-center">
                  <input
                    aria-label={`Choice ${i + 1}`}
                    className="flex-1 text-sm border rounded px-2 py-1"
                    value={c}
                    onChange={(e) => updateChoice(i, e.target.value)}
                  />
                  <button
                    className="text-xs text-rose-600 hover:underline"
                    onClick={() => removeChoice(i)}
                    aria-label={`Remove choice ${i + 1}`}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-800">{c}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }, [local.choices, editing, removeChoice, updateChoice]);

  return (
    <article className={cn("bg-white border rounded p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {typeof index === "number" && <div className="text-sm text-slate-500">Q{index + 1}</div>}
            <div className="flex-1">
              {editing ? (
                <input
                  aria-label="Edit question prompt"
                  value={local.prompt}
                  onChange={(e) => updateField("prompt", e.target.value)}
                  className="w-full text-sm font-medium border rounded px-2 py-1"
                />
              ) : (
                <h3 className="text-sm font-medium text-slate-900">{local.prompt}</h3>
              )}
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-3">
                <span>{local.type.toUpperCase()}</span>
                {local.confidence !== undefined && (
                  <span className="inline-flex items-center gap-2 text-xs">
                    <span className="text-slate-500">AI confidence</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">{Math.round((local.confidence ?? 0) * 100)}%</span>
                  </span>
                )}
                {local.tags && local.tags.length > 0 && <span className="text-xs text-slate-500">Tags: {local.tags.join(", ")}</span>}
              </div>
            </div>
          </div>

          {/* Choices or TF / FIB */}
          <div>
            {isMCQ && renderChoices}
            {isTF && (
              <div className="mt-3">
                {editing ? (
                  <div className="flex gap-3">
                    <label className="text-sm">
                      <input
                        type="radio"
                        name={`tf_${local.id}`}
                        checked={local.answer === "True"}
                        onChange={() => updateField("answer", "True")}
                        className="mr-2"
                      />
                      True
                    </label>
                    <label className="text-sm">
                      <input
                        type="radio"
                        name={`tf_${local.id}`}
                        checked={local.answer === "False"}
                        onChange={() => updateField("answer", "False")}
                        className="mr-2"
                      />
                      False
                    </label>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-700">Answer: {String(local.answer)}</div>
                )}
              </div>
            )}
            {/* Theory / FIB show explanation edit */}
            {local.explanation && (
              <div className="mt-3 text-sm text-slate-600">
                <label className="block text-xs text-slate-500 mb-1">Explanation</label>
                {editing ? (
                  <textarea
                    value={local.explanation}
                    onChange={(e) => updateField("explanation", e.target.value)}
                    rows={3}
                    className="w-full text-sm border rounded p-2"
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm text-slate-700">{local.explanation}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action column */}
        <div className="flex-shrink-0 ml-3 flex flex-col items-end gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className={cn("px-3 py-1 rounded text-sm bg-emerald-600 text-white", saving && "opacity-60")}
                disabled={saving}
                aria-label="Save changes"
                type="button"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setLocal(question); setEditing(false); }}
                className="text-sm text-slate-600 hover:underline"
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <button onClick={() => setEditing(true)} className="px-3 py-1 rounded border text-sm">
                  Edit
                </button>
                <button onClick={handleRegenerate} className="px-3 py-1 rounded border text-sm">
                  Regenerate
                </button>
                <button onClick={handleAccept} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
                  Accept
                </button>
                <button onClick={handleReject} className="px-3 py-1 rounded border text-sm text-rose-600">
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* optional status line */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-slate-500">{statusMessage}</div>
        {showSource && question.source && (
  <div className="text-xs text-slate-400">Source: {question.source.slice(0, 60)}</div>
)}

      </div>
    </article>   
  );
}

