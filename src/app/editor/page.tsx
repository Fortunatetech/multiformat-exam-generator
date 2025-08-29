// src/app/editor/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Quiz, QuizQuestion } from "@/lib/api";
import { useAppStore } from "@/stores/useAppStore";
import QuestionCard from "@/components/layout/QuestionCard";
import { cn } from "@/lib/utils";
import ExportModal from "@/components/layout/ExportModal";
import SourcePreview from "@/components/layout/SourcePreview";

/**
 * Editor page (cleaned types & hooks)
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

  // keep dependencies stable by watching `currentQuiz` reference
  const questions = useMemo<QuizQuestion[]>(
    () => (currentQuiz ? currentQuiz.questions : []),
    [currentQuiz]
  );

  const selectedQuestion = useMemo<QuizQuestion | null>(
    () => questions.find((q) => q.id === selectedQuestionId) ?? questions[0] ?? null,
    [questions, selectedQuestionId]
  );

  // Save handler typed correctly
  const handleSave = async (q: QuizQuestion) => {
    updateQuestion(q.id, q);
  };

  const handleAccept = (id: string) => acceptQuestion(id);
  const handleReject = (id: string) => rejectQuestion(id);

  const handleRegenerate = (id: string) => {
    const q = questions.find((x) => x.id === id);
    updateQuestion(id, { prompt: "[Regenerated variant] " + (q?.prompt ?? ""), status: "regenerated" });
  };

  const handleExportGenerate = async (format: "json" | "txt" | "pdf") => {
    const json = exportCurrentQuizJSON();
    if (!json || !currentQuiz) return;

    if (format === "json") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentQuiz.quizId ?? "quiz"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else if (format === "txt") {
      // parse to typed Quiz
      const parsed = JSON.parse(json) as Quiz;
      const lines: string[] = [];
      lines.push(`${parsed.title ?? "Quiz"}\nSubject: ${parsed.subject ?? "-"}`);
      parsed.questions.forEach((qq, i) => {
        lines.push(`${i + 1}. ${qq.prompt}`);
        if (qq.choices) qq.choices.forEach((c, idx) => lines.push(`   ${String.fromCharCode(65 + idx)}. ${c}`));
        if (qq.answer !== undefined) lines.push(`   Answer: ${Array.isArray(qq.answer) ? qq.answer.join(", ") : qq.answer}`);
        lines.push("");
      });
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentQuiz.quizId ?? "quiz"}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      // PDF mock
      const blob = new Blob([json], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentQuiz.quizId ?? "quiz"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    setExportOpen(false);
  };

  const handleRegenerateFromAnchor = (anchorIndex: number) => {
    if (!selectedQuestion) return;
    const newPrompt = `${selectedQuestion.prompt} (regenerated from anchor #${anchorIndex + 1})`;
    updateQuestion(selectedQuestion.id, { prompt: newPrompt, status: "regenerated" });
  };

  const handleCopyToPrompt = (text: string) => {
    if (!selectedQuestion) return;
    updateQuestion(selectedQuestion.id, { prompt: text });
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
            <button onClick={() => acceptAll()} className="px-3 py-2 rounded border text-sm">Accept all</button>
            <button onClick={() => rejectAll()} className="px-3 py-2 rounded border text-sm">Reject all</button>
            <button onClick={() => setExportOpen(true)} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm">Export</button>
          </div>
        </div>

        {/* Two column layout: questions list + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: question list */}
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
                      <button onClick={() => handleAccept(selectedQuestion.id)} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Accept</button>
                      <button onClick={() => handleReject(selectedQuestion.id)} className="px-3 py-1 rounded border text-sm">Reject</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-slate-500">No question selected</div>
              )}
            </div>

            {/* SourcePreview component */}
            <SourcePreview
              question={selectedQuestion}
              onRegenerateFromAnchor={handleRegenerateFromAnchor}
              onCopyToPrompt={handleCopyToPrompt}
            />

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

      <ExportModal
        open={exportOpen}
        quiz={currentQuiz}
        onClose={() => setExportOpen(false)}
        onGenerate={(fmt) => handleExportGenerate(fmt as "json" | "txt" | "pdf")}
      />
    </div>
  );
}
