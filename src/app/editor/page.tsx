// src/app/editor/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";

import { cn } from "@/lib/utils";
import QuestionCard from "@/components/layout/QuestionCard";

/**
 * Editor page
 * - Renders a list of QuestionCard components for the current quiz
 * - Provides selection, bulk accept/reject and a small Export modal (JSON)
 *
 * Assumptions:
 * - QuestionCard exists at src/components/QuestionCard.tsx
 * - useAppStore provides currentQuiz + actions
 */

export default function EditorPage() {
  const currentQuiz = useAppStore((s) => s.currentQuiz);
  const selectedQuestionId = useAppStore((s) => s.selectedQuestionId);
  const setSelectedQuestion = useAppStore((s) => s.setSelectedQuestion);
  const updateQuestion = useAppStore((s) => s.updateQuestion);
  const acceptQuestion = useAppStore((s) => s.acceptQuestion);
  const rejectQuestion = useAppStore((s) => s.rejectQuestion);
  const acceptAll = useAppStore((s) => s.acceptAll);
  const rejectAll = useAppStore((s) => s.rejectAll);
  const exportCurrentQuizJSON = useAppStore((s) => s.exportCurrentQuizJSON);

  const [exportOpen, setExportOpen] = useState(false);

  const questions = currentQuiz?.questions ?? [];

  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === selectedQuestionId) ?? questions[0] ?? null,
    [questions, selectedQuestionId]
  );

  // Handle QuestionCard callbacks
  const handleSave = async (q: any) => {
    updateQuestion(q.id, q);
  };

  const handleAccept = (id: string) => {
    acceptQuestion(id);
  };

  const handleReject = (id: string) => {
    rejectQuestion(id);
  };

  const handleRegenerate = (id: string) => {
    // For now, regenerate is a placeholder: mark as 'regenerated' then update prompt
    updateQuestion(id, { prompt: "[Regenerated variant] " + (questions.find((x) => x.id === id)?.prompt ?? "") });
  };

  const handleExportGenerate = () => {
    const json = exportCurrentQuizJSON();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    // auto-download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentQuiz?.quizId ?? "quiz"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  if (!currentQuiz) {
    return (
      <div className="py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold">No quiz loaded</h2>
          <p className="mt-3 text-slate-600">
            Use the <Link href="/">Home</Link> page to upload files and generate a quiz. After generation, return here to review and export.
          </p>
          <div className="mt-6">
            <Link href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Editor — {currentQuiz.title ?? "Untitled quiz"}</h1>
            <div className="text-sm text-slate-500">Subject: {currentQuiz.subject ?? "—"}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { acceptAll(); }}
              className="px-3 py-2 rounded border text-sm"
              type="button"
            >
              Accept all
            </button>
            <button
              onClick={() => { rejectAll(); }}
              className="px-3 py-2 rounded border text-sm"
              type="button"
            >
              Reject all
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="px-3 py-2 rounded bg-emerald-600 text-white text-sm"
              type="button"
            >
              Export
            </button>
          </div>
        </div>

        {/* Two column layout: questions list + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: question list (span 2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            {questions.map((q, idx) => {
              const isSelected = selectedQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestion(q.id)}
                  className={cn("rounded-md", isSelected ? "ring-2 ring-emerald-200" : "")}
                >
                  <QuestionCard
                    question={q}
                    index={idx}
                    onSave={handleSave}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onRegenerate={handleRegenerate}
                    showSource={false}
                  />
                </div>
              );
            })}
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="bg-white border rounded p-4">
              <h3 className="text-sm font-medium">Selected question</h3>
              {selectedQuestion ? (
                <>
                  <div className="mt-3 text-sm">
                    <div className="font-medium">{selectedQuestion.prompt}</div>
                    <div className="mt-2 text-xs text-slate-500">Type: {selectedQuestion.type.toUpperCase()}</div>
                    {selectedQuestion.confidence !== undefined && (
                      <div className="mt-2 text-xs text-slate-500">
                        AI confidence: {Math.round((selectedQuestion.confidence ?? 0) * 100)}%
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleAccept(selectedQuestion.id)} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
                        Accept
                      </button>
                      <button onClick={() => handleReject(selectedQuestion.id)} className="px-3 py-1 rounded border text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-slate-500">No question selected</div>
              )}
            </div>

            {/* Source preview */}
            <div className="bg-white border rounded p-4">
              <h3 className="text-sm font-medium">Source preview</h3>
              <div className="mt-3 text-sm text-slate-600">
                {/* If your question has a `source` or `sourceAnchors`, render it here */}
                {selectedQuestion && (selectedQuestion as any).source ? (
                  <div className="whitespace-pre-wrap text-sm text-slate-800">{(selectedQuestion as any).source}</div>
                ) : (
                  <div className="text-sm text-slate-500">Source not available for this demo question.</div>
                )}
              </div>
            </div>

            {/* Quiz meta */}
            <div className="bg-white border rounded p-4">
              <h3 className="text-sm font-medium">Quiz info</h3>
              <div className="mt-2 text-sm text-slate-600">
                <div>Questions: {questions.length}</div>
                <div className="mt-1">Generated: {new Date(currentQuiz.generatedAt).toLocaleString()}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Export modal (simple JSON export) */}
      {exportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-lg bg-white rounded shadow p-6">
            <h2 className="text-lg font-medium">Export quiz</h2>
            <p className="mt-2 text-sm text-slate-600">Download the current quiz as JSON for now (demo).</p>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={handleExportGenerate} className="px-4 py-2 rounded bg-emerald-600 text-white">Generate & Download</button>
              <button onClick={() => setExportOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
