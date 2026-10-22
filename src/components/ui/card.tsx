"use client";

import * as React from "react";
import { cn } from "./utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  );
});
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  );
});
CardContent.displayName = "CardContent";

const CardDescription = React.forwardRef<HTMLParagraphElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <p ref={ref} className={cn("text-sm text-slate-500", className)} {...props} />
  );
});
CardDescription.displayName = "CardDescription";

export { Card, CardHeader, CardTitle, CardContent, CardDescription };
