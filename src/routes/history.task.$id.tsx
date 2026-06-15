import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Flag, Lightbulb } from "lucide-react";

import { getTaskPlan } from "@/lib/tasks.functions";
import { Button } from "@/components/ui/button";
import { AIDisclaimer } from "@/components/ai-disclaimer";

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Low: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/history/task/$id")({
  loader: async ({ params }) => {
    const row = await getTaskPlan({ data: { id: params.id } });
    if (!row) throw notFound();
    return row as any;
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Plan not found.</div>,
  component: TaskHistory,
});

function TaskHistory() {
  const row = Route.useLoaderData();
  const prioritized = (row.prioritized ?? []) as {
    task: string;
    priority: "High" | "Medium" | "Low";
    estimate_minutes: number;
  }[];
  const schedule = (row.schedule ?? []) as { time: string; task: string }[];
  const tips = (row.tips ?? []) as string[];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link to="/tasks">
          <ArrowLeft className="size-4" /> Back to Task Planner
        </Link>
      </Button>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-6 text-xs uppercase tracking-wider text-muted-foreground">
          {row.hours}h available · {new Date(row.created_at).toLocaleString()}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Flag className="size-4 text-primary" /> Prioritized Tasks
            </h2>
            <ul className="space-y-2">
              {prioritized.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span>{p.task}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {p.estimate_minutes}m
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${priorityColors[p.priority]}`}
                    >
                      {p.priority}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="size-4 text-primary" /> Daily Schedule
            </h2>
            <ol className="space-y-2 border-l-2 border-border pl-4">
              {schedule.map((s, i) => (
                <li key={i} className="relative">
                  <div className="absolute -left-[19px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {s.time}
                  </div>
                  <div className="text-sm">{s.task}</div>
                </li>
              ))}
            </ol>
          </section>
          {tips.length > 0 && (
            <section className="space-y-2 md:col-span-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="size-4 text-primary" /> Productivity Tips
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {tips.map((t, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border bg-primary-soft/30 px-3 py-2 text-sm"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      <AIDisclaimer />
    </div>
  );
}
