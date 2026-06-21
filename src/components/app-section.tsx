import type { ReactNode } from "react";
import { Link } from "@/components/link";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc mt-1">{description}</p>}
      </div>
      {badge}
      {children}
    </header>
  );
}

export function AppCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white/80 p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppSection({
  title,
  description,
  action,
  children,
  unboxed = false,
  className,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: ReactNode;
  unboxed?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 text-sm text-muted hover:text-foreground no-underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {unboxed ? children : <AppCard>{children}</AppCard>}
    </section>
  );
}

export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white/80 p-4 sm:p-5">
      <div className="mb-4 flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted-subtle text-xs font-semibold text-foreground">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white/60 px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white/90 px-4 py-3 text-sm">
      {children}
    </div>
  );
}

export function AppList({ children }: { children: ReactNode }) {
  return <ul className="space-y-2">{children}</ul>;
}

export function AppListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "rounded-xl border border-border/80 bg-muted-subtle/30 px-3 py-3 text-sm sm:px-4",
        className,
      )}
    >
      {children}
    </li>
  );
}

export function PersonRow({
  name,
  subtitle,
  avatarUrl,
  accentColor,
  trailing,
  id,
  nameSuffix,
}: {
  name: string;
  subtitle?: ReactNode;
  avatarUrl?: string | null;
  accentColor?: string;
  trailing?: ReactNode;
  id: string;
  nameSuffix?: ReactNode;
}) {
  return (
    <Link href={`/person/${id}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            name={name}
            avatarUrl={avatarUrl}
            size="md"
            accentColor={accentColor}
          />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1 font-medium text-foreground">{name}{nameSuffix}</p>
            {subtitle && (
              <div className="mt-0.5 text-xs text-muted">{subtitle}</div>
            )}
          </div>
        </div>
        {trailing && (
          <div className="flex flex-wrap items-center gap-2">{trailing}</div>
        )}
      </div>
    </Link>
  );
}

export function DaysBadge({ days }: { days: number }) {
  const label = days === 0 ? "Today" : `${days}d`;
  const urgent = days <= 7;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        urgent ? "bg-foreground text-white" : "bg-muted-subtle text-muted",
      )}
    >
      {label}
    </span>
  );
}
