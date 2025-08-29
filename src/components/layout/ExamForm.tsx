// src/components/ExamForm.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { uploadFiles, getJobStatus, getQuiz, type Quiz } from "@/lib/api";
import { useAppStore } from "@/stores/useAppStore";
import Button from "./ui/Button";

type Complexity = "MiddleSchool" | "HighSchool" | "Undergrad" | "Corporate";

export type GenerationConfig = {
  title: string;
  subject: string;
  questionCount: number; // 1-10
  questionType: "mixed" | "mcq" | "tf" | "fib" | "theory";
  complexity: Complexity;
  aoc: string[]; // areas of concentration
  language?: string;
};

type Props = {
  initial?: Partial<GenerationConfig>;
  onGenerate?: (config: GenerationConfig, files?: File[]) => Promise<void> | void;
};

export default function ExamForm({ initial, onGenerate }: Props) {
  const router = useRouter();
  const setQuiz = useAppStore((s) => s.setQuiz);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [questionCount, setQuestionCount] = useState<number>(initial?.questionCount ?? 5);
  const [questionType, setQuestionType] = useState<GenerationConfig["questionType"]>(initial?.questionType ?? "mixed");
  const [complexity, setComplexity] = useState<Complexity>(initial?.complexity ?? "HighSchool");
  const [aocInput, setAocInput] = useState("");
  const [aocTags, setAocTags] = useState<string[]>(initial?.aoc ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number | null>(null);

  // Tag helpers
  const addTag = useCallback(() => {
    const trimmed = aocInput.trim();
    if (!trimmed) return;
    if (aocTags.includes(trimmed)) {
      setAocInput("");
      return;
    }
    setAocTags((s) => [...s, trimmed]);
    setAocInput("");
  }, [aocInput, aocTags]);

  const removeTag = useCallback((t: string) => {
    setAocTags((s) => s.filter((x) => x !== t));
  }, []);

  // File handlers
  const handleFiles = useCallback((fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl);
    setFiles((s) => [...s, ...arr]);
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((s) => s.filter((_, i) => i !== idx));
  }, []);

  const configValid = useMemo(() => {
    return title.trim().length > 0 && subject.trim().length > 0 && questionCount >= 1 && questionCount <= 10;
  }, [title, subject, questionCount]);

  const buildConfig = useCallback((): GenerationConfig => {
    return {
      title: title.trim() || "Untitled quiz",
      subject: subject.trim() || "General",
      questionCount,
      questionType,
      complexity,
      aoc: aocTags,
      language: undefined,
    };
  }, [title, subject, questionCount, questionType, complexity, aocTags]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    if (!configValid) {
      setError("Please provide a title, subject and a valid number of questions (1-10).");
      return;
    }
    const config = buildConfig();
    setLoading(true);
    setJobProgress(null);

    try {
      if (onGenerate) {
        await onGenerate(config, files.length ? files : undefined);
      } else if (files.length > 0) {
        // Use the mock upload + poll flow from src/lib/api
        const { jobId } = await uploadFiles(files);
        // poll
        let finished = false;
        while (!finished) {
          // small delay
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 700));
          // eslint-disable-next-line no-await-in-loop
          const status = await getJobStatus(jobId);
          setJobProgress(status.progress);
          if (status.status === "done") {
            finished = true;
            // eslint-disable-next-line no-await-in-loop
            const q = await getQuiz(jobId);
            if (q) {
              setQuiz(q);
              // navigate to editor for review
              router.push("/editor");
            } else {
              setError("Generation finished but result could not be retrieved.");
            }
          } else if (status.status === "failed") {
            finished = true;
            setError(status.message ?? "Generation failed.");
          }
        }
      } else {
        // No files and no custom onGenerate — generate a quick demo quiz client-side for UI flow
        const demo: Quiz = {
          quizId: `demo_${Math.random().toString(36).slice(2, 8)}`,
          title: config.title,
          subject: config.subject,
          generatedAt: new Date().toISOString(),
          questions: Array.from({ length: config.questionCount }).map((_, i) => ({
            id: `demo_q_${i + 1}`,
            type: config.questionType === "mixed" ? (i % 2 === 0 ? "mcq" : "tf") : (config.questionType as any),
            prompt: `Demo question ${i + 1} — about ${config.subject}`,
            choices: i % 2 === 0 ? ["A", "B", "C", "D"] : undefined,
            answer: i % 2 === 0 ? "A" : "True",
            explanation: "This is a demo generated question for prototyping UI.",
          })),
        };
        setQuiz(demo);
        router.push("/editor");
      }
    } catch (err: any) {
      setError(err?.message ?? "Generation failed unexpectedly.");
    } finally {
      setLoading(false);
      setJobProgress(null);
    }
  }, [buildConfig, configValid, files, onGenerate, router, setQuiz]);

  // handle Enter key for tag input
  const onTagKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  return (
    <section className="max-w-3xl mx-auto bg-white border rounded p-6">
      <h2 className="text-lg font-semibold">Create an exam</h2>
      <p className="mt-1 text-sm text-slate-600">Set exam metadata and either upload files or generate a demo quiz.</p>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium">Exam title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g. Biology — Chapter 3 assessment"
            aria-label="Exam title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g. Biology"
            aria-label="Subject"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Number of questions</label>
            <input
              type="number"
              min={1}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              aria-label="Number of questions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Complexity / Level</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as Complexity)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              aria-label="Complexity level"
            >
              <option value="MiddleSchool">Middle School</option>
              <option value="HighSchool">High School</option>
              <option value="Undergrad">Undergraduate</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Question type</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as GenerationConfig["questionType"])}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            aria-label="Question type"
          >
            <option value="mixed">Mixed (MCQ & True/False)</option>
            <option value="mcq">Multiple choice (MCQ)</option>
            <option value="tf">True / False</option>
            <option value="fib">Fill-in-the-Blank</option>
            <option value="theory">Theory / Essay</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Area(s) of concentration (optional)</label>
          <div className="mt-1 flex gap-2 items-center">
            <input
              value={aocInput}
              onChange={(e) => setAocInput(e.target.value)}
              onKeyDown={onTagKey}
              placeholder="Add a topic and press Enter"
              className="flex-1 rounded border px-3 py-2 text-sm"
              aria-label="Area of concentration"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {aocTags.map((t) => (
              <div key={t} className="inline-flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-sm">
                <span>{t}</span>
                <button aria-label={`Remove ${t}`} type="button" onClick={() => removeTag(t)} className="text-xs text-rose-600">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Optional files (PDF, DOCX, images)</label>
          <input type="file" multiple className="mt-1" onChange={(e) => handleFiles(e.target.files)} />
          {files.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                  <div>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-xs text-rose-600">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <div className="mt-4 flex items-center gap-3">
          <Button loading={loading} onClick={handleGenerate}>
            Generate exam
          </Button>
          <Button variant="secondary" onClick={() => {
            setTitle("");
            setSubject("");
            setQuestionCount(5);
            setQuestionType("mixed");
            setComplexity("HighSchool");
            setAocTags([]);
            setFiles([]);
          }}>
            Reset
          </Button>

          {jobProgress !== null && (
            <div className="ml-4 text-sm text-slate-600">Progress: {Math.round(jobProgress)}%</div>
          )}
        </div>
      </div>
    </section>
  );
}
