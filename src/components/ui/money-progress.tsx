import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";

export function getFundingPercent(collected: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((collected / target) * 100));
}

type MoneyProgressProps = {
  collected: number;
  target: number;
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export function MoneyProgress({
  collected,
  target,
  label = "Funded",
  className,
  size = "md",
}: MoneyProgressProps) {
  const percent = getFundingPercent(collected, target);
  const complete = target > 0 && collected >= target;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">
          {label}:{" "}
          <span className="font-medium tabular-nums text-foreground">
            {formatAmount(collected)}
          </span>
          <span className="text-muted"> / {formatAmount(target)}</span>
        </span>
        <span
          className={cn(
            "shrink-0 font-medium tabular-nums",
            complete ? "text-emerald-600" : "text-foreground",
          )}
        >
          {percent}%
        </span>
      </div>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted-subtle",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percent}%`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            complete ? "bg-emerald-600" : "bg-accent",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {complete && (
        <p className="text-xs font-medium text-emerald-600">Fully funded</p>
      )}
    </div>
  );
}
