import NextLink from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AppLinkProps = ComponentProps<typeof NextLink> & {
  variant?: "default" | "nav" | "button" | "ghost";
};

const variants = {
  default: "text-foreground underline-offset-4",
  nav: "text-sm text-muted hover:text-foreground transition-colors",
  button:
    "inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover transition-colors",
  ghost:
    "inline-flex h-9 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground hover:bg-muted-subtle transition-colors",
};

export function Link({
  className,
  variant = "default",
  ...props
}: AppLinkProps) {
  return <NextLink className={cn(variants[variant], className)} {...props} />;
}
