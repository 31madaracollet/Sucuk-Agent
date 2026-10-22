"use client";

import * as React from "react";
import { cn } from "./utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sucuk-600 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Select.displayName = "Select";

export { Select };
