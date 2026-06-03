import NextLink from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AppLinkProps = ComponentProps<typeof NextLink> & {
  variant?: "default" | "nav" | "button" | "ghost";
};

const variants = {
  default: "text-party-fuchsia hover:text-party-pink font-medium transition-colors",
  nav: "text-party-ink/80 hover:text-party-fuchsia transition-colors text-sm font-medium",
  button:
    "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-party-pink to-party-fuchsia px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-party-pink/30 hover:scale-[1.02] transition-transform",
  ghost:
    "inline-flex items-center justify-center rounded-full border border-party-pink/30 bg-white/60 px-5 py-2.5 text-sm font-semibold text-party-ink hover:bg-party-cream transition-colors",
};

export function Link({ className, variant = "default", ...props }: AppLinkProps) {
  return (
    <NextLink className={cn(variants[variant], className)} {...props} />
  );
}
