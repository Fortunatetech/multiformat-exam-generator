// src/app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import React from "react";
import "./globals.css";
import { cn } from "@/lib/utils";

// App components (ensure these exist at these paths)
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Multi-format Exam Generator",
  description: "Generate exams in various formats with ease.",
  // You can extend with openGraph, twitter, authors etc later.
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={cn(
          poppins.className,
          "min-h-screen bg-slate-50 text-slate-900 antialiased"
        )}
      >
        {/* Accessibility: skip link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:rounded-md focus:shadow"
        >
          Skip to content
        </a>

        {/* Header / Top nav */}
        <Header />

        {/* Main content area with padding and centered container */}
        <main id="main" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* TODO: Add providers (theme, auth, i18n) and analytics scripts here */}
      </body>
    </html>
  );
}
