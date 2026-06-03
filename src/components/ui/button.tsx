import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover",
        party: "bg-accent text-white hover:bg-accent-hover",
        outline:
          "border border-border bg-white text-foreground hover:bg-muted-subtle",
        ghost: "text-muted hover:text-foreground hover:bg-muted-subtle",
        danger: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
      },
      size: {
        sm: "h-10 px-3 text-xs md:h-8",
        md: "h-11 px-4 md:h-9",
        lg: "h-12 px-5 md:h-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    loadingText?: ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const showLoading = loading;
  const label = showLoading ? (loadingText ?? children) : children;

  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || showLoading}
      aria-busy={showLoading || undefined}
      {...props}
    >
      {showLoading && (
        <Spinner
          size="sm"
          className={variant === "primary" || variant === "party" || variant === "danger" || variant === "success" ? "text-white" : "text-foreground"}
        />
      )}
      {label}
    </button>
  );
}
