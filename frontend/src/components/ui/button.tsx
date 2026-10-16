import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent" | "yellow" | "orange";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080a10] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold shadow-md shadow-yellow-500/10 focus:ring-yellow-400",
      yellow:
        "bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold shadow-md shadow-yellow-500/10 focus:ring-yellow-400",
      secondary:
        "bg-[#131926] hover:bg-[#1a2233] text-slate-100 border border-slate-700/80 focus:ring-slate-400",
      outline:
        "border border-yellow-400/50 hover:border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 focus:ring-yellow-400",
      ghost:
        "text-slate-300 hover:text-white hover:bg-slate-800/60 focus:ring-slate-400",
      accent:
        "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500",
      orange:
        "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 focus:ring-orange-500",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
