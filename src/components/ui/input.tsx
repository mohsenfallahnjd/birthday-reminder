import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border-2 border-party-pink/20 bg-white px-4 py-3 text-party-ink placeholder:text-party-ink/40 focus:border-party-fuchsia focus:outline-none focus:ring-2 focus:ring-party-pink/30",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-party-ink/80", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border-2 border-party-pink/20 bg-white px-4 py-3 text-party-ink placeholder:text-party-ink/40 focus:border-party-fuchsia focus:outline-none focus:ring-2 focus:ring-party-pink/30 min-h-[100px]",
        className,
      )}
      {...props}
    />
  );
}
