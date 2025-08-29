// src/components/ExamFormClient.tsx
"use client";

import React, { useState } from "react";
import ExamForm, { GenerationConfig } from "./ExamForm";
import type { FileWithMeta } from "@/types"; // optional

export default function ExamFormClient({ initial }: { initial?: Partial<GenerationConfig> }) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate(config: GenerationConfig, files?: File[]) {
    setLoading(true);
    try {
      if (config.sourceMode === "upload" && files && files.length > 0) {
        const form = new FormData();
        // Put the config JSON in a 'payload' field (stringified)
        const cfgCopy = { ...config };
        // do not include actual File objects inside payload JSON
        form.append("payload", JSON.stringify(cfgCopy));
        files.forEach((f) => form.append("files", f));
        const res = await fetch("/api/generate-exam", {
          method: "POST",
          body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Upload failed");
        // you can poll job status here (json.jobId)
        alert("Upload queued. Job ID: " + json.jobId);
      } else {
        // paste mode -> POST JSON
        const res = await fetch("/api/generate-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Generation failed");
        // If server returns quiz directly (demo), you can navigate to editor or use setQuiz
        if (json.status === "done" && json.quiz) {
          // TODO: wire into your app store / router as needed
          alert("Demo quiz generated: " + json.quiz.quizId);
        } else {
          alert("Job queued: " + json.jobId);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  return <ExamForm initial={initial} onGenerate={handleGenerate} />;
}
