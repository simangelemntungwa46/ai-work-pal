import { Sparkles } from "lucide-react";

export function ThinkingShimmer({ label = "Thinking…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary-soft/40 px-4 py-3">
      <Sparkles className="size-4 text-primary animate-pulse" />
      <span className="relative overflow-hidden bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text text-sm font-medium text-transparent [background-size:200%_100%] animate-[shimmer_2s_linear_infinite]">
        {label}
      </span>
      <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>
    </div>
  );
}
