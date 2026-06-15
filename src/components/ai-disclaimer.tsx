import { Info } from "lucide-react";

export function AIDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <p>
        AI-generated content may contain inaccuracies. Always review and verify outputs
        before using them for business, legal, financial, or professional purposes.
      </p>
    </div>
  );
}
