// src/components/ExamPreview.tsx
"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Button from "./ui/Button";
import type { Quiz } from "@/lib/api";

type Props = {
  quiz: Quiz;
  includeAnswers?: boolean;
  className?: string;
};

export default function ExamPreview({ quiz, includeAnswers = false, className }: Props) {
  const [showAnswers, setShowAnswers] = useState(includeAnswers);

  const jsonBlobUrl = useMemo(() => {
    try {
      const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [quiz]);

  const handlePrint = () => {
    // Simple print: open a new window with printable markup
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    const html = `
      <html>
        <head>
          <title>${quiz.title ?? "Quiz"}</title>
          <style>
            body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin: 40px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 12px; }
            .q { margin-bottom: 16px; }
            .choices { margin-left: 16px; }
            .meta { color: #6b7280; font-size: 13px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <h1>${quiz.title ?? "Quiz"}</h1>
          <div class="meta">Subject: ${quiz.subject ?? "-"} • Generated: ${new Date(quiz.generatedAt).toLocaleString()}</div>
          ${quiz.questions
            .map((q, i) => {
              const choices = q.choices ? `<ul class="choices">${q.choices.map((c) => `<li>${c}</li>`).join("")}</ul>` : "";
              const answer = showAnswers ? `<div style="color:#374151;font-size:13px;margin-top:6px;"><strong>Answer:</strong> ${Array.isArray(q.answer) ? q.answer.join(", ") : q.answer ?? "-"}</div>` : "";
              return `<div class="q"><div><strong>Q${i + 1}.</strong> ${q.prompt}</div>${choices}${answer}</div>`;
            })
            .join("")}
        </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
    // give the new window a moment to render then call print
    setTimeout(() => {
      w.print();
    }, 300);
  };

  return (
    <div className={cn("max-w-4xl mx-auto bg-white border rounded p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{quiz.title ?? "Generated quiz"}</h2>
          <div className="text-sm text-slate-500">Subject: {quiz.subject ?? "—"}</div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowAnswers((s) => !s)}>
            {showAnswers ? "Hide answers" : "Show answers"}
          </Button>
          <Button onClick={handlePrint}>Print</Button>
          <a href={jsonBlobUrl ?? "#"} download={`${quiz.quizId ?? "quiz"}.json`} aria-hidden={!jsonBlobUrl}>
            <Button variant="ghost">Download JSON</Button>
          </a>
        </div>
      </div>

      <ol className="mt-4 space-y-4 list-decimal list-inside">
        {quiz.questions.map((q, idx) => (
          <li key={q.id} className="bg-slate-50 p-3 rounded">
            <div className="text-sm font-medium">{q.prompt}</div>
            {q.choices && (
              <ul className="mt-2 space-y-1 text-sm">
                {q.choices.map((c, i) => (
                  <li key={i} className="pl-3">
                    <span className="mr-2 text-slate-500">{String.fromCharCode(65 + i)}.</span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
            {showAnswers && (
              <div className="mt-2 text-xs text-slate-600">
                <strong>Answer:</strong> {Array.isArray(q.answer) ? q.answer.join(", ") : q.answer ?? "—"}
                {q.explanation && <div className="mt-1 text-xs text-slate-500">Explanation: {q.explanation}</div>}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
