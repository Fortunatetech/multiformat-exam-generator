// src/app/api/generate-exam/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import formidable from "formidable";
import { z } from "zod";

export const runtime = "nodejs"; // ensure node runtime for formidable

// Zod schema for incoming generation config
const GenerationSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  questionCount: z.number().int().min(1).max(100),
  questionType: z.enum(["mixed", "mcq", "tf", "fib", "theory"]),
  complexity: z.enum(["MiddleSchool", "HighSchool", "Undergrad", "Corporate"]),
  aoc: z.array(z.string()).optional(),
  language: z.string().optional(),
  sourceMode: z.enum(["paste", "upload"]).optional(),
  pastedText: z.string().optional(),
});

// utility to create random jobId
function makeJobId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(12).toString("hex");
}

// small demo quiz generator (same shape as your Quiz type in frontend)
// NOTE: in prod you'd trigger your worker/AI pipeline instead
function makeDemoQuiz(cfg: z.infer<typeof GenerationSchema>) {
  const n = cfg.questionCount;
  const questions = Array.from({ length: n }).map((_, i) => {
    const type =
      cfg.questionType === "mixed"
        ? (i % 2 === 0 ? "mcq" : "tf")
        : cfg.questionType;
    return {
      id: `demo_q_${i + 1}`,
      type,
      prompt: `Demo question ${i + 1} — about ${cfg.subject}`,
      choices: type === "mcq" ? ["A", "B", "C", "D"] : undefined,
      answer: type === "mcq" ? "A" : "True",
      explanation: "Demo explanation.",
    };
  });

  return {
    quizId: `demo_${Math.random().toString(36).slice(2, 8)}`,
    title: cfg.title,
    subject: cfg.subject,
    generatedAt: new Date().toISOString(),
    questions,
  };
}

// parse JSON body helper
async function parseJsonBody(req: Request) {
  try {
    const body = await req.json();
    return body;
  } catch (err) {
    return null;
  }
}

// parse multipart/form-data using formidable
async function parseMultipart(req: Request) {
  // formidable expects a Node.js IncomingMessage. In Next.js app router Node runtime, req is compatible.
  const form = formidable({
    multiples: true,
    maxFileSize: 50 * 1024 * 1024, // 50 MB per file limit (adjust in prod)
    keepExtensions: true,
    uploadDir: os.tmpdir(),
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    // @ts-ignore - formidable expects Node req
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// safe move file to job folder and return saved path
async function persistUploadedFile(tmpPath: string, filename: string, jobDir: string) {
  const destPath = path.join(jobDir, filename);
  // ensure dest dir exists
  await fs.mkdir(jobDir, { recursive: true });
  // move (rename) the file (works on same disk). If rename fails, fallback to copy.
  try {
    await fs.rename(tmpPath, destPath);
  } catch (e) {
    // fallback copy & unlink
    const data = await fs.readFile(tmpPath);
    await fs.writeFile(destPath, data);
    await fs.unlink(tmpPath).catch(() => {});
  }
  return destPath;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // If JSON
    if (contentType.includes("application/json")) {
      const body = await parseJsonBody(req);
      if (!body) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      // Validate using zod. Convert numeric types if necessary.
      const parsed = GenerationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
      }

      // For paste-mode: we can immediately return a demo result or enqueue a job.
      // Here we return an immediate demo response (for fast feedback).
      const jobId = makeJobId();
      const quiz = makeDemoQuiz(parsed.data);

      // Persist a minimal job file for tracking (jobs/ directory). In prod use DB/queue.
      const jobsRoot = path.join(process.cwd(), "jobs");
      await fs.mkdir(jobsRoot, { recursive: true });
      const jobMeta = {
        jobId,
        status: "done",
        type: "demo",
        createdAt: new Date().toISOString(),
        payload: parsed.data,
        result: quiz,
      };
      await fs.writeFile(path.join(jobsRoot, `${jobId}.json`), JSON.stringify(jobMeta, null, 2), "utf-8");

      return NextResponse.json({ jobId, status: "done", quiz });
    }

    // If multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = await parseMultipart(req);

      // We expect a 'payload' field (stringified JSON) or individual fields. Normalize:
      let payloadObj: any = {};
      if (fields.payload) {
        try {
          payloadObj = typeof fields.payload === "string" ? JSON.parse(fields.payload) : fields.payload;
        } catch (err) {
          return NextResponse.json({ error: "Invalid payload JSON in multipart form" }, { status: 400 });
        }
      } else {
        // include possible top-level fields that appeared as strings
        payloadObj = { ...fields } as any;
        // convert common numeric fields
        if (typeof payloadObj.questionCount === "string") payloadObj.questionCount = Number(payloadObj.questionCount);
        if (typeof payloadObj.aoc === "string") {
          try {
            payloadObj.aoc = JSON.parse(payloadObj.aoc);
          } catch {
            // if comma-separated
            payloadObj.aoc = payloadObj.aoc.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }
      }

      const parsed = GenerationSchema.safeParse(payloadObj);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
      }

      // files can be single or multiple; collect file objects from formidable Files structure
      const savedFilesPaths: string[] = [];
      // create job entry
      const jobId = makeJobId();
      const jobDir = path.join(process.cwd(), "uploads", jobId);
      await fs.mkdir(jobDir, { recursive: true });

      // iterate over files object
      const fileEntries: [string, formidable.File | formidable.File[]][] = Object.entries(files) as any;
      for (const [fieldName, fileVal] of fileEntries) {
        if (!fileVal) continue;
        if (Array.isArray(fileVal)) {
          for (const f of fileVal) {
            const name = f.newFilename ?? f.originalFilename ?? `file-${Date.now()}`;
            const tmpPath = f.filepath;
            const saved = await persistUploadedFile(tmpPath, name, jobDir);
            savedFilesPaths.push(saved);
          }
        } else {
          const f = fileVal as formidable.File;
          const name = f.newFilename ?? f.originalFilename ?? `file-${Date.now()}`;
          const tmpPath = f.filepath;
          const saved = await persistUploadedFile(tmpPath, name, jobDir);
          savedFilesPaths.push(saved);
        }
      }

      // Save job metadata (queued) — in prod push to queue (Redis/BullMQ/Cloud Tasks)
      const jobsRoot = path.join(process.cwd(), "jobs");
      await fs.mkdir(jobsRoot, { recursive: true });
      const jobMeta = {
        jobId,
        status: "queued",
        createdAt: new Date().toISOString(),
        payload: parsed.data,
        files: savedFilesPaths,
      };
      await fs.writeFile(path.join(jobsRoot, `${jobId}.json`), JSON.stringify(jobMeta, null, 2), "utf-8");

      // In production: enqueue job for background worker. For now respond with queued jobId
      return NextResponse.json({ jobId, status: "queued", message: "Files saved and job queued" });
    }

    // Unsupported content-type
    return NextResponse.json({ error: "Unsupported Content-Type. Use application/json or multipart/form-data" }, { status: 415 });
  } catch (err) {
    console.error("generate-exam error:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}
