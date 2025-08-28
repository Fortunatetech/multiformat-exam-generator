// src/app/page.tsx
import FileUploadCard from "@/components/layout/FileUploadCard";

export default function Home() {
  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold">From scan to exam in under a minute</h1>
        <p className="mt-3 text-slate-600">
          Upload PDFs, Word docs, images or paste text and let Multiformat generate high-quality exam questions you can export to PDF, DOCX, JSON, or TXT.
        </p>
      </div>

      <div className="mt-10">
        <FileUploadCard />
      </div>
    </div>
  );
}
