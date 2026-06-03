import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        party:
          "bg-gradient-to-r from-party-pink via-party-fuchsia to-party-purple text-white shadow-lg shadow-party-pink/40 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-party-pink/30 bg-white/70 text-party-ink hover:border-party-fuchsia hover:bg-party-cream",
        ghost: "text-party-ink hover:bg-party-pink/10",
        danger: "bg-red-500 text-white hover:bg-red-600",
        success: "bg-emerald-500 text-white hover:bg-emerald-600",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3 text-base",
      },
    },
    defaultVariants: { variant: "party", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
