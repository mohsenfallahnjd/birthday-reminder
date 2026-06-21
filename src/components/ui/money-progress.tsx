import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";

export function getFundingPercent(collected: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((collected / target) * 100));
}

type MoneyProgressProps = {
  collected: number;
  target: number;
  /** Amount within `collected` that came from the general pool — shown in a lighter shade */
  fromGeneral?: number;
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export function MoneyProgress({
  collected,
  target,
  fromGeneral = 0,
  label = "Funded",
  className,
  size = "md",
}: MoneyProgressProps) {
  const percent = getFundingPercent(collected, target);
  const ownCollected = Math.max(0, collected - fromGeneral);
  const ownPct = getFundingPercent(ownCollected, target);
  const poolPct = Math.max(0, percent - ownPct);
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
          "relative w-full overflow-hidden rounded-full bg-muted-subtle",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percent}%`}
      >
        {/* own contributions */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out",
            complete ? "bg-emerald-600" : "bg-accent",
          )}
          style={{ width: `${ownPct}%` }}
        />
        {/* general pool portion (lighter) */}
        {poolPct > 0 && (
          <div
            className={cn(
              "absolute top-0 h-full rounded-r-full transition-all duration-500 ease-out",
              complete ? "bg-emerald-300" : "bg-accent/35",
            )}
            style={{ left: `${ownPct}%`, width: `${poolPct}%` }}
          />
        )}
      </div>
      {complete && (
        <p className="text-xs font-medium text-emerald-600">Fully funded</p>
      )}
      {fromGeneral > 0 && !complete && (
        <p className="text-[11px] text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-accent/35 mr-1 align-middle" />
          {formatAmount(fromGeneral)} from shared pool
        </p>
      )}
    </div>
  );
}
