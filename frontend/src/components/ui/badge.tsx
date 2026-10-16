import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "orange" | "green" | "blue" | "slate" | "yellow";
}

export function Badge({
  className,
  variant = "yellow",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    yellow: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    slate: "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border uppercase",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
