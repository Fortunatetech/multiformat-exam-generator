// src/components/FileUploadCard.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { uploadFiles, getJobStatus, getQuiz, type JobStatus, type Quiz } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  accept?: string;
  maxSizeMB?: number;
  onJobComplete?: (quiz: Quiz) => void;
};

export default function FileUploadCard({ accept = ".pdf,.docx,.txt,.pptx,.png,.jpg", maxSizeMB = 50, onJobComplete }: Props) {
  const [queued, setQueued] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollRef = useRef<number | null>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const tooLarge = arr.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooLarge) {
      setError(`File "${tooLarge.name}" exceeds ${maxSizeMB} MB.`);
      return;
    }
    setError(null);
    setQueued((prev) => [...prev, ...arr]);
  }, [maxSizeMB]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.currentTarget.value = "";
  }, [addFiles]);

  const removeFile = useCallback((index: number) => {
    setQueued((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // poll job status until done
  const pollJob = useCallback((jobId: string) => {
    // clean up any prior interval
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const fetchOnce = async () => {
      try {
        const s = await getJobStatus(jobId);
        setJob(s);
        if (s.status === "done") {
          const q = await getQuiz(jobId);
          setQuiz(q);
          setUploading(false);
          if (q) onJobComplete?.(q);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (s.status === "failed") {
          setError(s.message ?? "Job failed");
          setUploading(false);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setUploading(false);
      }
    };

    // run immediately then poll
    fetchOnce();
    pollRef.current = window.setInterval(fetchOnce, 800);
  }, [onJobComplete]);

  const startUpload = useCallback(async () => {
    if (queued.length === 0) {
      setError("Please add at least one file to upload.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { jobId } = await uploadFiles(queued);
      pollJob(jobId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setUploading(false);
    }
  }, [queued, pollJob]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  return (
    <section className="w-full max-w-3xl mx-auto">
      <label
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={onDrop}
        className={cn(
          "group block border-2 rounded-lg p-6 text-center transition-colors",
          "border-dashed border-slate-200 hover:border-slate-300",
          "bg-white"
        )}
      >
        <input ref={inputRef} type="file" multiple accept={accept} className="sr-only" onChange={onFileChange} />
        <div className="flex flex-col items-center justify-center gap-4 select-none">
          <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M7 16V8m0 0L12 3m-5 5h10" />
          </svg>

          <div>
            <p className="text-lg font-medium text-slate-900">Drag & drop files here</p>
            <p className="text-sm text-slate-500">PDF, DOCX, PPTX, TXT, PNG, JPG — max {maxSizeMB}MB</p>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded border text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => inputRef.current?.click()}
            >
              Select files
            </button>

            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
              onClick={startUpload}
              disabled={uploading || queued.length === 0}
            >
              {uploading ? "Uploading…" : "Upload & Generate"}
            </button>
          </div>
        </div>
      </label>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {queued.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Queued files</h4>
          <ul className="space-y-2">
            {queued.map((f, idx) => (
              <li key={idx} className="flex items-center justify-between bg-white border rounded p-3">
                <div>
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                    aria-label={`Remove ${f.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {job && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Generation status</div>
            <div className="text-sm text-slate-500">{job.progress}%</div>
          </div>
          <div className="w-full bg-slate-100 rounded h-2 mt-2 overflow-hidden">
            <div style={{ width: `${job.progress}%` }} className="h-full bg-emerald-600 transition-all" />
          </div>
        </div>
      )}

      {quiz && (
        <div className="mt-6 bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">{quiz.title ?? "Generated quiz"}</h3>
              <div className="text-xs text-slate-500">Subject: {quiz.subject}</div>
            </div>
            <div className="text-xs text-slate-500">{new Date(quiz.generatedAt).toLocaleString()}</div>
          </div>

          <div className="space-y-3">
            {quiz.questions.slice(0, 4).map((q) => (
              <div key={q.id} className="p-3 border rounded">
                <div className="text-sm font-medium">{q.prompt}</div>
                {q.choices && (
                  <ul className="mt-2 text-sm text-slate-700">
                    {q.choices.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                )}
                {q.explanation && <div className="mt-2 text-xs text-slate-500">Explanation: {q.explanation}</div>}
              </div>
            ))}
            {quiz.questions.length > 4 && <div className="text-xs text-slate-500">...and {quiz.questions.length - 4} more</div>}
          </div>
        </div>
      )}
    </section>
  );
}
