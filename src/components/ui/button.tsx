import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-fg text-bg hover:bg-white/90 border border-transparent disabled:bg-fg/40 rounded-full",
  secondary:
    "bg-bg-elevated text-fg border border-border hover:border-[#3a3a3a] hover:bg-[#181818] rounded-full",
  ghost:
    "bg-transparent text-fg border border-transparent hover:bg-white/5 rounded-full",
  danger:
    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 rounded-full",
  accent:
    "bg-accent text-[#0a0a0a] border border-transparent hover:bg-[#1ed760] font-semibold rounded-full",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold tracking-tight transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
