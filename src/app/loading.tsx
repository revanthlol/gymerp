import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-card border border-border shadow-xl">
          <Spinner size="md" className="text-primary" />
        </div>
        <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">
          Loading
        </span>
      </div>
    </div>
  );
}
