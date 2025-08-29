// src/lib/api.ts
/**
 * Lightweight mock API used by the frontend during early development.
 * - Simulates file upload -> generation job -> finished quiz result.
 *
 * This module is intentionally client-friendly (runs in browser).
 * Replace with real API calls once backend endpoints are available.
 */

export type JobStatus = {
  jobId: string;
  status: "pending" | "processing" | "done" | "failed";
  progress: number; // 0..100
  message?: string;
};

/**
 * Source anchor indicates where in the source file a question was derived from.
 * Adjust shape as backend provides richer info (page, offsets, OCR confidence, etc).
 */
export type SourceAnchor = {
  page?: number;
  start?: number;
  end?: number;
  text?: string;
};

export type QuizQuestion = {
  id: string;
  type: "mcq" | "tf" | "fib" | "theory";
  prompt: string;
  choices?: string[];
  answer?: string | string[];
  explanation?: string;

  /** Model confidence (0..1). Optional for UI badges. */
  confidence?: number;

  /** Topic tags or areas of concentration extracted / suggested by the model */
  tags?: string[];

  /** Optional small snippet of the original source used to generate this question */
  source?: string;

  /** More precise anchors into the source (page/offset/text). */
  sourceAnchors?: SourceAnchor[];

  /**
   * UI-only status: "pending" | "accepted" | "rejected" | "regenerated"
   * Useful during review; backend model may use a different field later.
   */
  status?: "pending" | "accepted" | "rejected" | "regenerated";
};

export type Quiz = {
  quizId: string;
  title?: string;
  subject?: string;
  generatedAt: string;
  questions: QuizQuestion[];
};

type InternalJob = {
  jobId: string;
  progress: number;
  status: JobStatus["status"];
  timer?: number | undefined;
  result?: Quiz | null;
};

const JOB_STORE = new Map<string, InternalJob>();

/**
 * Simulate upload: we don't actually upload files anywhere.
 * Instead we create an in-memory job and begin progressing it.
 */
export async function uploadFiles(files: File[]): Promise<{ jobId: string }> {
  // create job id
  const jobId = `job_${Math.random().toString(36).slice(2, 10)}`;
  const job: InternalJob = {
    jobId,
    progress: 0,
    status: "pending",
    result: null,
  };
  JOB_STORE.set(jobId, job);

  // kick off fake processing asynchronously
  simulateProcessing(jobId, files);

  // emulate slight network latency
  await delay(200);
  return { jobId };
}

/** Polling endpoint to get job status */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const job = JOB_STORE.get(jobId);
  if (!job) {
    return { jobId, status: "failed", progress: 0, message: "Job not found." };
  }

  return {
    jobId,
    status: job.status,
    progress: Math.round(job.progress),
    message: job.status === "done" ? "Finished" : undefined,
  };
}

/** Retrieve the generated quiz once job is done */
export async function getQuiz(jobId: string): Promise<Quiz | null> {
  const job = JOB_STORE.get(jobId);
  if (!job) return null;
  // Wait a tick to simulate latency
  await delay(120);
  return job.result ?? null;
}

/* -----------------------------
   Helpers & simulation
   ----------------------------- */

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/** Build a minimal sample quiz based on filenames (demo only) */
function buildSampleQuiz(files: File[]): Quiz {
  const questions = files.flatMap((f, idx) => {
    // create 2 questions per file as demo
    const base = `${f.name.replace(/\.[^/.]+$/, "")} — sample`;

    const q1: QuizQuestion = {
      id: `q_${idx}_1`,
      type: "mcq",
      prompt: `Which statement about "${base}" is correct?`,
      choices: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
      explanation: "This is a generated example explanation.",
      confidence: Number((0.6 + Math.random() * 0.35).toFixed(3)), // 0.6..0.95
      tags: ["example", "topic-" + ((idx % 3) + 1)],
      source: `Excerpt from ${f.name}: \"${base.slice(0, Math.min(60, base.length))}\"`,
      sourceAnchors: [{ page: 1, start: 0, end: 120, text: base.slice(0, 120) }],
      status: "pending",
    };

    const q2: QuizQuestion = {
      id: `q_${idx}_2`,
      type: "tf",
      prompt: `True or False: "${base}" is covered in the uploaded file.`,
      answer: "True",
      explanation: "Demo true/false question.",
      confidence: Number((0.5 + Math.random() * 0.4).toFixed(3)), // 0.5..0.9
      tags: ["truefalse"],
      source: `Excerpt from ${f.name}: \"${base.slice(0, Math.min(80, base.length))}\"`,
      sourceAnchors: [{ page: 1, start: 120, end: 200, text: base.slice(120, 200) }],
      status: "pending",
    };

    return [q1, q2];
  });

  return {
    quizId: `quiz_${Math.random().toString(36).slice(2, 8)}`,
    title: `Demo quiz (${files.map((f) => f.name).join(", ")})`,
    subject: "Demo",
    generatedAt: new Date().toISOString(),
    questions,
  };
}

/** Simulate processing by incrementing progress and finishing with a sample quiz */
function simulateProcessing(jobId: string, files: File[]) {
  const job = JOB_STORE.get(jobId);
  if (!job) return;
  job.status = "processing";
  job.progress = 2;

  // increase progress over time; finish after ~3.5s + file-dependent time
  const totalMs = 3500 + Math.min(6000, files.length * 500); // scale with file count up to limit
  const steps = 12;
  const stepMs = Math.max(200, Math.floor(totalMs / steps));
  let step = 0;

  const t = window.setInterval(() => {
    step += 1;
    job.progress = Math.min(95, job.progress + Math.random() * (100 / steps) + (100 / steps - 3));
    // at last step, finalize
    if (step >= steps) {
      job.progress = 100;
      job.status = "done";
      job.result = buildSampleQuiz(files);
      clearInterval(t);
    }
  }, stepMs);

  job.timer = t as unknown as number;
  JOB_STORE.set(jobId, job);
}
