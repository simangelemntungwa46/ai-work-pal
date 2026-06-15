import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, Sparkles, Clock, Flag, Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { planTasks, listTaskPlans } from "@/lib/tasks.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { ThinkingShimmer } from "@/components/thinking-shimmer";

type Plan = {
  prioritized: { task: string; priority: "High" | "Medium" | "Low"; estimate_minutes: number }[];
  schedule: { time: string; task: string }[];
  tips: string[];
};

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Low: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Planner — Lumina" },
      {
        name: "description",
        content: "Plan your day with AI: prioritize, schedule, and time-block tasks.",
      },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const planFn = useServerFn(planTasks);
  const listFn = useServerFn(listTaskPlans);
  const queryClient = useQueryClient();

  const [tasks, setTasks] = useState("");
  const [hours, setHours] = useState(8);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [result, setResult] = useState<Plan | null>(null);

  const recent = useQuery({ queryKey: ["task_plans"], queryFn: () => listFn() });

  const mutation = useMutation({
    mutationFn: (input: { tasks: string; hours: number; priority: "Low" | "Medium" | "High" }) =>
      planFn({ data: input }),
    onSuccess: (row) => {
      if (!row) return;
      setResult({
        prioritized: (row.prioritized as Plan["prioritized"]) ?? [],
        schedule: (row.schedule as Plan["schedule"]) ?? [],
        tips: (row.tips as string[]) ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ["task_plans"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasks.trim()) {
      toast.error("Add at least one task.");
      return;
    }
    mutation.mutate({ tasks, hours, priority });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <header className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <ListChecks className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Task Planner</h1>
          <p className="text-sm text-muted-foreground">
            Drop in your to-dos and available hours — get a prioritized, scheduled day.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="tasks">Tasks (one per line)</Label>
            <Textarea
              id="tasks"
              rows={10}
              placeholder={"Finalize Q3 report\nReview design mockups\nCall the vendor\n..."}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hours">Available hours</Label>
              <Input
                id="hours"
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority bias</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Sparkles className="size-4" />
            {mutation.isPending ? "Planning…" : "Generate Plan"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="min-h-[420px] rounded-2xl border border-border bg-card p-6">
            {mutation.isPending ? (
              <ThinkingShimmer label="Optimizing your day…" />
            ) : (
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="grid gap-6 md:grid-cols-2"
                  >
                    <section className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Flag className="size-4 text-primary" /> Prioritized Tasks
                      </h3>
                      <ul className="space-y-2">
                        {result.prioritized.map((p, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0">{p.task}</span>
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
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Clock className="size-4 text-primary" /> Daily Schedule
                      </h3>
                      <ol className="space-y-2 border-l-2 border-border pl-4">
                        {result.schedule.map((s, i) => (
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

                    {result.tips.length > 0 && (
                      <section className="space-y-2 md:col-span-2">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <Lightbulb className="size-4 text-primary" /> Productivity Tips
                        </h3>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {result.tips.map((t, i) => (
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full min-h-[380px] flex-col items-center justify-center gap-3 text-center"
                  >
                    <div className="grid size-12 place-items-center rounded-xl bg-muted">
                      <ListChecks className="size-5 text-muted-foreground" />
                    </div>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Your prioritized plan will appear here.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
          <AIDisclaimer />
        </div>
      </div>

      {recent.data && recent.data.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent plans
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {recent.data.map((row) => (
              <Link
                key={row.id}
                to="/history/task/$id"
                params={{ id: row.id }}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="line-clamp-1 min-w-0 text-sm">
                  {row.tasks.split("\n")[0]}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {row.hours}h · {new Date(row.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
