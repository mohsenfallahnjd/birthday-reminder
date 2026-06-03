import NextImage from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AppImageProps = ComponentProps<typeof NextImage> & {
  frame?: "none" | "party" | "avatar";
};

const frames = {
  none: "",
  party: "rounded-2xl ring-4 ring-party-yellow/60 shadow-xl shadow-party-pink/20",
  avatar: "rounded-full ring-4 ring-party-pink/40",
};

export function Image({ className, frame = "none", alt, ...props }: AppImageProps) {
  return (
    <NextImage
      className={cn(frames[frame], className)}
      alt={alt}
      {...props}
    />
  );
}
