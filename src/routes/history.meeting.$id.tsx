import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Calendar, User } from "lucide-react";

import { getMeeting } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/history/meeting/$id")({
  loader: async ({ params }) => {
    const row = await getMeeting({ data: { id: params.id } });
    if (!row) throw notFound();
    return row as any;
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Summary not found.</div>,
  component: MeetingHistory,
});

function MeetingHistory() {
  const row = Route.useLoaderData();
  const decisions = (row.decisions ?? []) as string[];
  const actions = (row.action_items ?? []) as { task: string; owner?: string }[];
  const deadlines = (row.deadlines ?? []) as { item: string; due: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link to="/meetings">
          <ArrowLeft className="size-4" /> Back to Meetings
        </Link>
      </Button>
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {new Date(row.created_at).toLocaleString()}
        </div>
        <section>
          <h2 className="mb-2 text-sm font-semibold">Executive Summary</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{row.summary}</p>
        </section>
        {decisions.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Key Decisions</h2>
            <ul className="space-y-1.5 text-sm">
              {decisions.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {actions.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Action Items</h2>
            <ul className="space-y-2">
              {actions.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span>{a.task}</span>
                  {a.owner ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                      <User className="size-3" /> {a.owner}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}
        {deadlines.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Deadlines</h2>
            <ul className="space-y-1.5 text-sm">
              {deadlines.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    <strong>{d.due}</strong> — {d.item}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <AIDisclaimer />
    </div>
  );
}
