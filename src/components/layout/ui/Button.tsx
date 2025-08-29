// src/components/ui/Button.tsx
"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  secondary: "bg-white border text-slate-700 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

const Spinner = (props: { className?: string }) => (
  <svg
    className={cn("animate-spin", props.className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { children, className, variant = "primary", size = "md", loading = false, disabled, ...rest } = props;

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      {...rest}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isDisabled ? "opacity-60 cursor-not-allowed" : "",
        className
      )}
    >
      {loading && <Spinner className={cn("mr-2 h-4 w-4 text-current")} />}
      <span>{children}</span>
    </button>
  );
});

Button.displayName = "Button";

export default Button;
