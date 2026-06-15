import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Download, CheckCircle2, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

import { summarizeMeeting, listMeetings } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { ThinkingShimmer } from "@/components/thinking-shimmer";

type Summary = {
  summary: string;
  decisions: string[];
  action_items: { task: string; owner?: string }[];
  deadlines: { item: string; due: string }[];
};

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — Lumina" },
      {
        name: "description",
        content: "Turn meeting notes into summaries, action items, and decisions.",
      },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const summarizeFn = useServerFn(summarizeMeeting);
  const listFn = useServerFn(listMeetings);
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<Summary | null>(null);

  const recent = useQuery({ queryKey: ["meetings"], queryFn: () => listFn() });

  const mutation = useMutation({
    mutationFn: (input: { notes: string }) => summarizeFn({ data: input }),
    onSuccess: (row) => {
      if (!row) return;
      setResult({
        summary: row.summary,
        decisions: (row.decisions as string[]) ?? [],
        action_items: (row.action_items as Summary["action_items"]) ?? [],
        deadlines: (row.deadlines as Summary["deadlines"]) ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim().length < 20) {
      toast.error("Please paste a bit more content to summarize.");
      return;
    }
    mutation.mutate({ notes });
  };

  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    let y = 16;
    const write = (text: string, size = 11, bold = false) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 14, y);
      y += lines.length * size * 0.5 + 3;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
    };
    write("Meeting Summary", 18, true);
    write(new Date().toLocaleString(), 9);
    y += 2;
    write("Executive Summary", 13, true);
    write(result.summary);
    if (result.decisions.length) {
      write("Key Decisions", 13, true);
      result.decisions.forEach((d) => write("• " + d));
    }
    if (result.action_items.length) {
      write("Action Items", 13, true);
      result.action_items.forEach((a) =>
        write(`• ${a.task}${a.owner ? ` — ${a.owner}` : ""}`),
      );
    }
    if (result.deadlines.length) {
      write("Deadlines", 13, true);
      result.deadlines.forEach((d) => write(`• ${d.item} — ${d.due}`));
    }
    doc.save("meeting-summary.pdf");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <header className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <FileText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meeting Summarizer</h1>
          <p className="text-sm text-muted-foreground">
            Paste raw notes — get an executive summary, decisions, and action items.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="notes">Meeting notes</Label>
            <Textarea
              id="notes"
              rows={16}
              placeholder="Paste your raw meeting notes or transcript here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Sparkles className="size-4" />
            {mutation.isPending ? "Summarizing…" : "Summarize"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="min-h-[420px] rounded-2xl border border-border bg-card p-6">
            {mutation.isPending ? (
              <ThinkingShimmer label="Reading your meeting…" />
            ) : (
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Summary
                      </span>
                      <Button size="sm" variant="ghost" onClick={exportPdf} className="gap-1.5">
                        <Download className="size-3.5" /> Export PDF
                      </Button>
                    </div>

                    <section>
                      <h3 className="mb-2 text-sm font-semibold">Executive Summary</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {result.summary}
                      </p>
                    </section>

                    {result.decisions.length > 0 && (
                      <section>
                        <h3 className="mb-2 text-sm font-semibold">Key Decisions</h3>
                        <ul className="space-y-1.5 text-sm">
                          {result.decisions.map((d, i) => (
                            <li key={i} className="flex gap-2">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {result.action_items.length > 0 && (
                      <section>
                        <h3 className="mb-2 text-sm font-semibold">Action Items</h3>
                        <ul className="space-y-2">
                          {result.action_items.map((a, i) => (
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

                    {result.deadlines.length > 0 && (
                      <section>
                        <h3 className="mb-2 text-sm font-semibold">Deadlines</h3>
                        <ul className="space-y-1.5 text-sm">
                          {result.deadlines.map((d, i) => (
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full min-h-[380px] flex-col items-center justify-center gap-3 text-center"
                  >
                    <div className="grid size-12 place-items-center rounded-xl bg-muted">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Your structured summary will appear here.
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
            Recent summaries
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {recent.data.map((row) => (
              <Link
                key={row.id}
                to="/history/meeting/$id"
                params={{ id: row.id }}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="line-clamp-2 min-w-0 text-sm text-muted-foreground">
                  {row.summary}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
