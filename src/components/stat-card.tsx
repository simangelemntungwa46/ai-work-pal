import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-foreground">{value}</div>
      {accent ? <div className="mt-1 text-xs text-primary">{accent}</div> : null}
    </div>
  );
}
