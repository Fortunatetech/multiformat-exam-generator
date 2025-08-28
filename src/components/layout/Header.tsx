// src/components/layout/Header.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Header / Top navigation
 *
 * - Responsive: desktop nav + mobile menu
 * - Accessible: keyboard focus, aria attributes, skip link handled in layout
 * - Extensible: replace CTA / auth areas with real components (AuthButton, Avatar) later
 */

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Product", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
  { label: "Enterprise", href: "/enterprise" },
];

export default function Header() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white font-semibold">
                MF
              </span>
              <span className="ml-3 text-lg font-semibold text-slate-900">Multiformat</span>
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <nav aria-label="Primary" className="hidden md:flex md:items-center md:space-x-6">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium px-1 py-2 rounded",
                    active ? "text-emerald-700" : "text-slate-700 hover:text-slate-900"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:text-slate-900 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">Toggle navigation</span>
              {/* Icon: hamburger / close */}
              {mobileOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              )}
            </button>

            {/* Desktop CTAs */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
                Log in
              </Link>

              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Try it free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav (collapsible) */}
      <div
        id="mobile-menu"
        className={cn(
          "md:hidden bg-white border-t transition-max-h duration-200 ease-in-out overflow-hidden",
          mobileOpen ? "max-h-96" : "max-h-0"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="px-4 pt-3 pb-6 space-y-2">
          <nav className="flex flex-col space-y-1" aria-label="Mobile primary">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    active ? "text-emerald-700" : "text-slate-700 hover:text-slate-900"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t">
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 text-sm text-slate-700 hover:text-slate-900"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>

            <Link
              href="/create"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block w-full text-center px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Try it free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
