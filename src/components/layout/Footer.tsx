// src/components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("w-full border-t bg-white")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              aria-label="Multiformat home"
              className="flex items-center gap-3"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white font-semibold">
                MF
              </span>
              <span className="text-lg font-semibold text-slate-900">Multiformat</span>
            </Link>

            <p className="text-sm text-slate-600">
              Fast, reliable AI-driven exam generation. Export to PDF, DOCX, JSON, and TXT.
            </p>

            <div className="flex items-center space-x-3 mt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100"
                aria-label="Multiformat on Twitter"
              >
                <svg aria-hidden className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 7.5c-.6.3-1.3.5-2 .6.7-.4 1.2-1.1 1.4-1.9-.7.4-1.5.7-2.3.9C16.6 6 15.9 5.5 15 5.5c-1.4 0-2.6 1.2-2.6 2.7 0 .2 0 .4.1.6-2.2-.1-4.1-1.2-5.4-2.9-.2.4-.3.9-.3 1.4 0 1 .6 1.9 1.5 2.4-.5 0-.9-.1-1.3-.3v.1c0 1.3.9 2.4 2.1 2.7-.2.1-.4.1-.7.1-.2 0-.3 0-.5-.1.3 1 1.3 1.7 2.4 1.7C9 17 7.8 17.6 6.5 17.6c-.3 0-.6 0-.8-.1 1 0 1.9.3 2.9.9 1.7 1.1 3.8 1.7 6 1.7 7.2 0 11.1-6 11.1-11.1v-.5c.8-.6 1.4-1.3 1.9-2.1-.7.3-1.4.6-2.1.7z" />
                </svg>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100"
                aria-label="Multiformat on LinkedIn"
              >
                <svg aria-hidden className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.08 1 2.5 1 4.98 2.12 4.98 3.5zM.2 8h4.6V24H.2V8zM8.5 8h4.4v2.2h.1c.6-1.1 2-2.2 4.1-2.2 4.4 0 5.2 2.9 5.2 6.7V24h-4.6v-7.4c0-1.8 0-4.1-2.5-4.1-2.5 0-2.8 1.9-2.8 3.9V24H8.5V8z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/features" className="hover:underline">Features</Link>
              </li>
              <li>
                <Link href="/create" className="hover:underline">Try it free</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:underline">Pricing</Link>
              </li>
              <li>
                <Link href="/templates" className="hover:underline">Templates</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/docs" className="hover:underline">Docs & API</Link>
              </li>
              <li>
                <Link href="/tutorials" className="hover:underline">Tutorials</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:underline">Blog</Link>
              </li>
              <li>
                <Link href="/support" className="hover:underline">Help Center</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:underline">About</Link>
              </li>
              <li>
                <Link href="/careers" className="hover:underline">Careers</Link>
              </li>
              <li>
                <Link href="/enterprise" className="hover:underline">Enterprise</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-slate-600">
            © {year} Multiformat — All rights reserved.
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <span aria-hidden>·</span>
            <a href="mailto:support@multiformat.example" className="hover:underline">support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
