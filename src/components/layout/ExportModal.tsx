// src/components/ExportModal.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Quiz } from "@/lib/api";
import Button from "./ui/Button";
import { cn } from "@/lib/utils";

type Format = "json" | "txt" | "pdf";

type Props = {
  open: boolean;
  quiz: Quiz | null;
  onClose: () => void;
  /**
   * onGenerate receives the chosen format and returns an optional Promise.
   * If omitted, the component will perform client-side download for JSON/TXT and
   * a simple mocked file for PDF.
   */
  onGenerate?: (format: Format) => Promise<void> | void;
};

export default function ExportModal({ open, quiz, onClose, onGenerate }: Props) {
  const [format, setFormat] = useState<Format>("json");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [loading, setLoading] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setFormat("json");
      setIncludeAnswers(true);
      // trap focus: put focus on dialog
      setTimeout(() => dialogRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const doDownload = async (fmt: Format) => {
    if (!quiz) return;
    setLoading(true);
    try {
      if (onGenerate) {
        await onGenerate(fmt);
        setLoading(false);
        onClose();
        return;
      }

      if (fmt === "json") {
        const data = includeAnswers ? quiz : { ...quiz, questions: quiz.questions.map((q) => ({ ...q, answer: undefined })) };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quiz.quizId ?? "quiz"}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (fmt === "txt") {
        const lines: string[] = [];
        lines.push(`${quiz.title ?? "Quiz"}\nSubject: ${quiz.subject ?? "-"}`);
        quiz.questions.forEach((q, i) => {
          lines.push(`${i + 1}. ${q.prompt}`);
          if (q.choices) {
            q.choices.forEach((c, idx) => lines.push(`   ${String.fromCharCode(65 + idx)}. ${c}`));
          }
          if (includeAnswers) lines.push(`   Answer: ${Array.isArray(q.answer) ? q.answer.join(", ") : q.answer ?? "-"}`);
          lines.push("");
        });
        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quiz.quizId ?? "quiz"}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (fmt === "pdf") {
        // Demo/mock: generate a TXT and name it .pdf (real PDF generation would be server-side or client-side with a library)
        const text = `${quiz.title ?? "Quiz"}\n\n${quiz.questions
          .map((q, i) => `${i + 1}. ${q.prompt}\n${q.choices ? q.choices.join("\n") : ""}\n${includeAnswers ? "Answer: " + (Array.isArray(q.answer) ? q.answer.join(", ") : q.answer ?? "-") : ""}`)
          .join("\n\n")}`;
        const blob = new Blob([text], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quiz.quizId ?? "quiz"}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      // swallow - UI can show a toast in future
      console.error(err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        // close on click outside
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md bg-white rounded shadow p-6 outline-none"
        aria-labelledby="export-modal-title"
      >
        <h2 id="export-modal-title" className="text-lg font-medium">
          Export quiz
        </h2>

        <p className="mt-2 text-sm text-slate-600">Choose export format and options. (This demo performs client-side downloads.)</p>

        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">Format</legend>
            <div className="mt-2 flex gap-3">
              <label className={cn("inline-flex items-center gap-2 cursor-pointer")}>
                <input type="radio" name="export-format" checked={format === "json"} onChange={() => setFormat("json")} />
                <span className="text-sm">JSON</span>
              </label>
              <label className={cn("inline-flex items-center gap-2 cursor-pointer")}>
                <input type="radio" name="export-format" checked={format === "txt"} onChange={() => setFormat("txt")} />
                <span className="text-sm">Plain text (TXT)</span>
              </label>
              <label className={cn("inline-flex items-center gap-2 cursor-pointer")}>
                <input type="radio" name="export-format" checked={format === "pdf"} onChange={() => setFormat("pdf")} />
                <span className="text-sm">PDF (mock)</span>
              </label>
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={includeAnswers} onChange={(e) => setIncludeAnswers(e.target.checked)} />
              <span className="text-sm">Include answers</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={() => doDownload(format)}>Generate & Download</Button>
        </div>
      </div>
    </div>
  );
}
