import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Mail, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

import { generateEmail, listEmails } from "@/lib/email.functions";
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

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Lumina" },
      {
        name: "description",
        content: "Generate professional emails with AI in any tone.",
      },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const generateFn = useServerFn(generateEmail);
  const listFn = useServerFn(listEmails);
  const queryClient = useQueryClient();

  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<"Formal" | "Friendly" | "Persuasive">("Formal");
  const [instructions, setInstructions] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const recent = useQuery({ queryKey: ["emails"], queryFn: () => listFn() });

  const mutation = useMutation({
    mutationFn: (input: {
      purpose: string;
      recipient: string;
      tone: "Formal" | "Friendly" | "Persuasive";
      instructions: string;
    }) => generateFn({ data: input }),
    onSuccess: (row: any) => {
      if (!row) return;
      setSubject(row.subject);
      setBody(row.body);
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || !recipient.trim()) {
      toast.error("Purpose and recipient are required.");
      return;
    }
    mutation.mutate({ purpose, recipient, tone, instructions });
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <header className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Mail className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Email Generator</h1>
          <p className="text-sm text-muted-foreground">
            Draft a polished email in seconds. Pick a tone, give context, generate.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Input */}
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g. Request a meeting to discuss Q3 budget"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              placeholder="e.g. Sarah, Head of Marketing"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Additional instructions</Label>
            <Textarea
              id="instructions"
              rows={4}
              placeholder="Anything specific to mention or avoid?"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Sparkles className="size-4" />
            {mutation.isPending ? "Generating…" : "Generate Email"}
          </Button>
        </form>

        {/* Output */}
        <div className="space-y-4">
          <div className="min-h-[420px] rounded-2xl border border-border bg-card p-6">
            {mutation.isPending ? (
              <ThinkingShimmer label="Drafting your email…" />
            ) : (
              <AnimatePresence mode="wait">
                {subject || body ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Generated draft
                      </span>
                      <Button size="sm" variant="ghost" onClick={copyAll} className="gap-1.5">
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Body</Label>
                      <Textarea
                        rows={14}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="font-sans leading-relaxed"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full min-h-[380px] flex-col items-center justify-center gap-3 text-center"
                  >
                    <div className="grid size-12 place-items-center rounded-xl bg-muted">
                      <Mail className="size-5 text-muted-foreground" />
                    </div>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Your generated email will appear here. Fill in the form and click
                      Generate.
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
            Recent drafts
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {recent.data.map((row) => (
              <Link
                key={row.id}
                to="/history/email/$id"
                params={{ id: row.id }}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{row.subject}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    To {row.recipient} · {row.tone}
                  </div>
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
