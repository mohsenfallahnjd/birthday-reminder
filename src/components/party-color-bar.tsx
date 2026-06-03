import type { ReactNode } from "react";
import { partyGradientStyle } from "@/lib/ceremony-roles";

export function PartyColorBar({
  color,
  className = "",
  children,
}: {
  color: string;
  className?: string;
  children?: ReactNode;
}) {
  const style = partyGradientStyle(color);
  return (
    <div
      className={`overflow-hidden rounded-lg border-l-4 ${className}`}
      style={{ borderLeftColor: style.borderColor, background: style.background }}
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${color}, #fff0, ${color}88, ${color})`,
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}
