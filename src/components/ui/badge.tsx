"use client"

import * as React from "react"
import { cn } from "./utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "danger"
}

const variants = {
  default: "bg-zinc-900 text-zinc-300 border border-zinc-800",
  secondary: "bg-white text-black border border-white",
  success: "bg-emerald-950 text-emerald-200 border border-emerald-900",
  danger: "bg-red-950 text-red-200 border border-red-900",
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
