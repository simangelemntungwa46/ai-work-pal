import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Mail, FileText, ListChecks, Search, ArrowRight } from "lucide-react";

import { getStats } from "@/lib/stats.functions";
import { StatCard } from "@/components/stat-card";

const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: () => getStats(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumina AI Workspace" },
      {
        name: "description",
        content:
          "Your AI-powered productivity dashboard: emails, meeting summaries, task plans, and research.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useSuspenseQuery(statsQuery);

  const tools = [
    {
      title: "Smart Email Generator",
      description: "Draft polished emails in any tone — formal, friendly, persuasive.",
      to: "/email" as const,
      icon: Mail,
    },
    {
      title: "Meeting Summarizer",
      description: "Turn raw notes into summaries, decisions, and action items.",
      to: "/meetings" as const,
      icon: FileText,
    },
    {
      title: "AI Task Planner",
      description: "Prioritize tasks and schedule your day around available hours.",
      to: "/tasks" as const,
      icon: ListChecks,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-balance text-3xl font-bold tracking-tight">
          Welcome back to your workspace
        </h1>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          Lumina is your AI assistant for everyday workplace tasks — generate emails,
          summarize meetings, and plan your day in seconds.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Emails Generated"
          value={stats.emails}
          icon={Mail}
          accent="AI-drafted"
        />
        <StatCard
          label="Meetings Summarized"
          value={stats.meetings}
          icon={FileText}
          accent="Notes processed"
        />
        <StatCard
          label="Tasks Planned"
          value={stats.tasks}
          icon={ListChecks}
          accent="Plans created"
        />
        <StatCard
          label="Research Reports"
          value={stats.research}
          icon={Search}
          accent="Coming soon"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Jump back in</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <tool.icon className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-base font-semibold">{tool.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Open tool
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
