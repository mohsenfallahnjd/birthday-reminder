import NextImage from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AppImageProps = ComponentProps<typeof NextImage> & {
  frame?: "none" | "rounded" | "avatar";
};

const frames = {
  none: "",
  rounded: "rounded-lg border border-border",
  avatar: "rounded-full border border-border",
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
