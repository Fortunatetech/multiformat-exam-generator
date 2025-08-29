// src/components/ExamForm.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import {
  uploadFiles,
  getJobStatus,
  getQuiz,
  type Quiz,
  type QuizQuestion,
} from "@/lib/api";
import { useAppStore } from "@/stores/useAppStore";

/* Types */
export type QuestionType = "mixed" | "mcq" | "tf" | "fib" | "theory";
type Complexity = "MiddleSchool" | "HighSchool" | "Undergrad" | "Corporate";

export type GenerationConfig = {
  title: string;
  subject: string;
  questionCount: number; // 1-100
  questionType: QuestionType;
  complexity: Complexity;
  aoc: string[]; // areas of concentration
  language?: string;
  sourceMode: "paste" | "upload";
  pastedText?: string;
};

type Props = {
  initial?: Partial<GenerationConfig>;
  onGenerate?: (config: GenerationConfig, files?: File[]) => Promise<void> | void;
};

/* helper mapping for demo questions (keep your existing mapping behavior) */
function mapGenerationTypeToQuestionType(
  gt: GenerationConfig["questionType"],
  index: number
): QuizQuestion["type"] {
  if (gt === "mixed") return index % 2 === 0 ? "mcq" : "tf";
  if (gt === "mcq") return "mcq";
  if (gt === "tf") return "tf";
  if (gt === "fib") return "fib";
  return "theory";
}

export default function ExamForm({ initial, onGenerate }: Props) {
  const router = useRouter();
  const setQuiz = useAppStore((s) => s.setQuiz);

  /* Form state */
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [questionCount, setQuestionCount] = useState<number>(
    initial?.questionCount ?? 10
  );
  const [questionType, setQuestionType] = useState<QuestionType>(
    initial?.questionType ?? "mixed"
  );
  const [complexity, setComplexity] = useState<Complexity>(
    initial?.complexity ?? "HighSchool"
  );
  const [aocInput, setAocInput] = useState("");
  const [aocTags, setAocTags] = useState<string[]>(initial?.aoc ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState<string>("");
  const [sourceMode, setSourceMode] = useState<"paste" | "upload">(
    initial?.sourceMode ?? "paste"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  /* Tags */
  const addTag = useCallback(() => {
    const trimmed = aocInput.trim();
    if (!trimmed) return;
    if (!aocTags.includes(trimmed)) setAocTags((s) => [...s, trimmed]);
    setAocInput("");
  }, [aocInput, aocTags]);

  const removeTag = useCallback((t: string) => {
    setAocTags((s) => s.filter((x) => x !== t));
  }, []);

  const onTagKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  /* File handling (drag/drop + input) */
  const handleFiles = useCallback((fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl);
    // optional: filter by type/size here
    setFiles((s) => [...s, ...arr]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dt = e.dataTransfer;
      handleFiles(dt.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((s) => s.filter((_, i) => i !== idx));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* Validation */
  const configValid = useMemo(() => {
    if (!title.trim()) return false;
    if (!subject.trim()) return false;
    if (!(questionCount >= 1 && questionCount <= 100)) return false;
    if (sourceMode === "paste" && !pastedText.trim() && files.length === 0) return false;
    if (sourceMode === "upload" && files.length === 0) return false;
    return true;
  }, [title, subject, questionCount, sourceMode, pastedText, files]);

  /* Build payload */
  const buildConfig = useCallback((): GenerationConfig => {
    return {
      title: title.trim() || "Untitled exam",
      subject: subject.trim() || "General",
      questionCount,
      questionType,
      complexity,
      aoc: aocTags,
      language: undefined,
      sourceMode,
      pastedText: sourceMode === "paste" ? pastedText.trim() : undefined,
    };
  }, [title, subject, questionCount, questionType, complexity, aocTags, sourceMode, pastedText]);

  /* Main generate handler */
  const handleGenerate = useCallback(async () => {
    setError(null);
    if (!configValid) {
      setError(
        "Please fill the title, subject, valid question count (1–100), and supply source text or files."
      );
      return;
    }

    const config = buildConfig();
    setLoading(true);
    setJobProgress(null);

    try {
      if (onGenerate) {
        await onGenerate(config, files.length ? files : undefined);
        return;
      }

      // default behavior (like your original file-flow)
      if (files.length > 0 && sourceMode === "upload") {
        const { jobId } = await uploadFiles(files);
        let finished = false;
        while (!finished) {
          await new Promise((r) => setTimeout(r, 700));
          const status = await getJobStatus(jobId);
          setJobProgress(status.progress);
          if (status.status === "done") {
            finished = true;
            const q = await getQuiz(jobId);
            if (q) {
              setQuiz(q);
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
        // Demo generation when pasting or no files.
        const demo: Quiz = {
          quizId: `demo_${Math.random().toString(36).slice(2, 8)}`,
          title: config.title,
          subject: config.subject,
          generatedAt: new Date().toISOString(),
          questions: Array.from({ length: config.questionCount }).map((_, i) => {
            const qtype = mapGenerationTypeToQuestionType(config.questionType, i);
            const question: QuizQuestion = {
              id: `demo_q_${i + 1}`,
              type: qtype,
              prompt: `Demo question ${i + 1} — about ${config.subject}`,
              choices: qtype === "mcq" ? ["A", "B", "C", "D"] : undefined,
              answer: qtype === "mcq" ? "A" : "True",
              explanation: "This is a demo generated question for prototyping UI.",
              confidence: Number((0.6 + Math.random() * 0.3).toFixed(3)),
              tags: ["demo"],
              source: undefined,
              sourceAnchors: [],
              status: "pending",
            };
            return question;
          }),
        };
        setQuiz(demo);
        router.push("/editor");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setJobProgress(null);
    }
  }, [buildConfig, configValid, files, onGenerate, router, setQuiz, sourceMode]);

  /* small helpers */
  const friendlyCountLabel = `${questionCount} ${questionCount === 1 ? "question" : "questions"}`;

  return (
    <section className="max-w-3xl mx-auto bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-center">Create an exam</h2>
      <p className="mt-1 text-sm text-slate-600 text-center">
        Configure exam metadata, choose a source, then generate. You can paste source text directly or upload files.
      </p>


      <div className="mt-6 space-y-6">
        {/* Title + Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="col-span-2">
            <span className="block text-sm font-medium">Exam title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology — Chapter 3 assessment"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Exam title"
            />
          </label>

          <label>
            <span className="block text-sm font-medium">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Subject"
            />
          </label>
        </div>

        {/* Number + Type + Complexity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium">Number of questions</label>
            <div className="mt-1 flex gap-3 items-center">
              <input
                type="number"
                min={1}
                max={100}
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
                }
                className="w-24 rounded border px-3 py-2 text-sm"
                aria-label="Number of questions"
              />
      
            <p className="mt-1 text-xs text-slate-400">{friendlyCountLabel}</p>
          </div>

          </div>

<div>
  <label className="block text-sm font-medium">Question type</label>
  <select
    value={questionType}
    onChange={(e) => setQuestionType(e.target.value as QuestionType)}
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

        {/* Area of concentration (tags) */}
        <div>
          <label className="block text-sm font-medium">Area(s) of concentration</label>
          <div className="mt-2 flex gap-2">
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

        {/* Source mode toggle */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Source input</h3>
              <p className="text-xs text-slate-500">Choose how to provide source material for question generation.</p>
            </div>

            <div className="inline-flex rounded-md bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSourceMode("paste")}
                className={`px-3 py-1 text-sm rounded ${sourceMode === "paste" ? "bg-white shadow-sm" : "opacity-70"}`}
                aria-pressed={sourceMode === "paste"}
              >
                Paste text
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("upload")}
                className={`ml-1 px-3 py-1 text-sm rounded ${sourceMode === "upload" ? "bg-white shadow-sm" : "opacity-70"}`}
                aria-pressed={sourceMode === "upload"}
              >
                Upload files
              </button>
            </div>
          </div>

          <div className="mt-3">
            {sourceMode === "paste" ? (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                placeholder="Paste the source material you want the generator to use. The generator will extract question-worthy text."
                className="w-full rounded border px-3 py-2 text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Paste source text"
              />
            ) : (
              <>
                <div
                  ref={dropRef}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded border-2 border-dashed border-gray-200 p-6 text-center cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label="File upload dropzone"
                >
                  <p className="text-sm text-slate-600">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-2">Accepted: .pdf, .docx, .txt, images. Max recommended 20MB/file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {files.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                        <div className="truncate">
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => removeFile(i)} className="text-xs text-rose-600">
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                    <li className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Add more</Button>
                      <Button type="button" variant="ghost" onClick={clearFiles}>Clear</Button>
                    </li>
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error / progress */}
        {error && <div className="text-sm text-rose-600">{error}</div>}
        {jobProgress !== null && <div className="text-sm text-slate-600">Progress: {Math.round(jobProgress)}%</div>}

        {/* Centralized actions */}
        <div className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <Button loading={loading} onClick={handleGenerate} size="lg" className="px-8">
              {loading ? "Generating…" : "Generate exam"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setTitle("");
                setSubject("");
                setQuestionCount(10);
                setQuestionType("mixed");
                setComplexity("HighSchool");
                setAocTags([]);
                setFiles([]);
                setPastedText("");
                setError(null);
                setJobProgress(null);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
