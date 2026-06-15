import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { getEmail } from "@/lib/email.functions";
import { Button } from "@/components/ui/button";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/history/email/$id")({
  loader: async ({ params }) => {
    const row = await getEmail({ data: { id: params.id } });
    if (!row) throw notFound();
    return row as any;
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Email not found.</div>,
  component: EmailHistory,
});

function EmailHistory() {
  const row = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link to="/email">
          <ArrowLeft className="size-4" /> Back to Email Generator
        </Link>
      </Button>
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          To {row.recipient} · {row.tone} · {new Date(row.created_at).toLocaleString()}
        </div>
        <h1 className="text-xl font-semibold">{row.subject}</h1>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
          {row.body}
        </pre>
      </div>
      <AIDisclaimer />
    </div>
  );
}
