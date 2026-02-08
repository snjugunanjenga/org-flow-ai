import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { AlertTriangle, CheckCircle, Clock, XCircle, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  owner_name: string | null;
  created_at: string;
}

interface Conflict {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  parties: string[];
  resolution: string | null;
  created_at: string;
}

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-[hsl(40_90%_55%)]/10 text-[hsl(40_90%_55%)] border-[hsl(40_90%_55%)]/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, any> = {
  active: ArrowUpRight,
  in_review: Clock,
  blocked: XCircle,
  deferred: Clock,
  resolved: CheckCircle,
  completed: CheckCircle,
};

const severityColors: Record<string, string> = {
  critical: "border-l-destructive bg-destructive/5",
  high: "border-l-[hsl(40_90%_55%)] bg-[hsl(40_90%_55%)]/5",
  medium: "border-l-primary bg-primary/5",
  low: "border-l-muted-foreground bg-muted/50",
};

export default function TopicsView() {
  const orgId = useOrgId();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from("topics").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("conflicts").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    ]).then(([{ data: t }, { data: c }]) => {
      setTopics(t || []);
      setConflicts(c || []);
    });
  }, [orgId]);

  const openConflicts = conflicts.filter(c => c.status === "open");
  const resolvedConflicts = conflicts.filter(c => c.status === "resolved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Topics & Decisions</h1>
        <p className="text-muted-foreground mt-1">Tracked decisions, extracted topics, and conflict detection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-display">Active Topics ({topics.length})</h3>
          <div className="space-y-3">
            {topics.map(topic => {
              const StatusIcon = statusIcons[topic.status] || Clock;
              return (
                <div key={topic.id} className="glass-panel p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h4 className="text-sm font-semibold truncate">{topic.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[topic.priority] || priorityColors.medium}`}>
                          {topic.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">{topic.category}</span>
                        {topic.owner_name && (
                          <span className="text-[10px] text-muted-foreground">· {topic.owner_name}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(topic.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conflicts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Conflicts ({openConflicts.length} open)
          </h3>
          <div className="space-y-3">
            {openConflicts.map(c => (
              <div key={c.id} className={`glass-panel p-4 border-l-4 ${severityColors[c.severity] || severityColors.medium}`}>
                <h4 className="text-sm font-semibold mb-1">{c.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase">{c.severity}</span>
                  <span className="text-[10px] text-muted-foreground">{c.parties?.join(" vs ")}</span>
                </div>
              </div>
            ))}
            {resolvedConflicts.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-muted-foreground mt-4">Resolved</h4>
                {resolvedConflicts.map(c => (
                  <div key={c.id} className="glass-panel p-4 opacity-60">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold">{c.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.resolution}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
