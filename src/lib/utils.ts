// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class strings with clsx and tailwind-merge.
 * Keeps TypeScript typing and returns a string.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(...inputs));
};
