import { Check, SkipForward, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlanMilestone {
  id: string;
  name: string;
  status: string | null;
  target_date: string | null;
}

const statusStyles: Record<string, string> = {
  done: "bg-accent/15 text-accent border-accent/30",
  completed: "bg-accent/15 text-accent border-accent/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  skipped: "bg-muted text-muted-foreground border-border/50 line-through",
  pending: "bg-muted/40 text-muted-foreground border-border/50",
  todo: "bg-muted/40 text-muted-foreground border-border/50",
};

export function PlanMilestoneRow({
  milestone,
  onChange,
}: {
  milestone: PlanMilestone;
  onChange: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<"accept" | "skip" | null>(null);

  const update = async (status: "done" | "skipped", verb: string) => {
    setBusy(status === "done" ? "accept" : "skip");
    const { error } = await supabase
      .from("project_milestones")
      .update({ status })
      .eq("id", milestone.id);
    setBusy(null);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't update milestone", description: error.message });
      return;
    }
    toast({ title: `Milestone ${verb}`, description: milestone.name });
    onChange();
  };

  const status = milestone.status ?? "pending";
  const settled = status === "done" || status === "completed" || status === "skipped";
  const badgeClass = statusStyles[status] ?? statusStyles.pending;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-card/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeClass}`}>
            {status.replace("_", " ")}
          </span>
          <p className="text-sm font-medium truncate">{milestone.name}</p>
        </div>
        {milestone.target_date && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" /> Target {format(new Date(milestone.target_date), "MMM d, yyyy")}
          </p>
        )}
      </div>
      {!settled && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => update("done", "accepted")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 transition-colors"
            aria-label={`Accept milestone ${milestone.name}`}
          >
            {busy === "accept" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Accept
          </button>
          <button
            onClick={() => update("skipped", "skipped")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            aria-label={`Skip milestone ${milestone.name}`}
          >
            {busy === "skip" ? <Loader2 className="h-3 w-3 animate-spin" /> : <SkipForward className="h-3 w-3" />}
            Skip
          </button>
        </div>
      )}
    </div>
  );
}