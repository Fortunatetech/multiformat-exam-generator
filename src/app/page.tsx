// src/app/page.tsx
import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Client wrapper that mounts the interactive form (no SSR)
const ExamFormClient = dynamic(() => import("@/components/layout/ExamFormClient"), { ssr: false });

export const metadata: Metadata = {
  title: "Multiformat Exam Generator",
  description:
    "Create, customize, and export professional exams to PDF, DOCX, JSON, or TXT in seconds.",
};

export default function HomePage() {
  return (
    <main className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            From Idea to Exam in Under a Minute
          </h1>
          <p className="mt-4 text-lg text-slate-600 sm:text-xl">
            Easily create and customize exam questions with AI assistance, then export to{" "}
            <span className="font-semibold text-gray-900"> PDF, DOCX, JSON,</span> or{" "}
            <span className="font-semibold text-gray-900"> TXT</span>.
          </p>
        </header>

        {/* Form Section */}
        <section className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10">
            <ExamFormClient />
          </div>
        </section>
      </div>
    </main>
  );
}
