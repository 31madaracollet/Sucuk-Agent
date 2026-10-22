"use client";

import * as React from "react";
import { cn } from "./utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "danger";
}

const variants = {
  default: "bg-slate-100 text-slate-700 border border-slate-200",
  secondary: "bg-sucuk-500/10 text-sucuk-600 border border-sucuk-200",
  success: "bg-green-100 text-green-700 border border-green-200",
  danger: "bg-red-100 text-red-700 border border-red-200",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
