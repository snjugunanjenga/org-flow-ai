import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AgentLog {
  id: string;
  agent_type: string;
  action: string;
  input_summary: string | null;
  output_summary: string | null;
  reasoning: string | null;
  duration_ms: number | null;
  created_at: string;
}

const agentConfig: Record<string, { color: string; borderColor: string; label: string }> = {
  memory: { color: "bg-[hsl(var(--agent-memory))]/10 text-[hsl(var(--agent-memory))]", borderColor: "border-[hsl(var(--agent-memory))]/20", label: "Memory Agent" },
  router: { color: "bg-[hsl(var(--agent-router))]/10 text-[hsl(var(--agent-router))]", borderColor: "border-[hsl(var(--agent-router))]/20", label: "Router Agent" },
  critic: { color: "bg-[hsl(var(--agent-critic))]/10 text-[hsl(var(--agent-critic))]", borderColor: "border-[hsl(var(--agent-critic))]/20", label: "Critic Agent" },
  coordinator: { color: "bg-[hsl(var(--agent-coordinator))]/10 text-[hsl(var(--agent-coordinator))]", borderColor: "border-[hsl(var(--agent-coordinator))]/20", label: "Coordinator Agent" },
};

const agents = [
  { name: "Memory Agent", type: "memory", desc: "Extracts entities, generates embeddings, maintains organizational memory." },
  { name: "Router Agent", type: "router", desc: "Identifies stakeholders, routes critical information to the right people." },
  { name: "Critic Agent", type: "critic", desc: "Detects conflicts, contradictions, and misalignment across decisions." },
  { name: "Coordinator Agent", type: "coordinator", desc: "Orchestrates agent responses, manages user interactions." },
];

export default function AgentsView() {
  const orgId = useOrgId();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AgentLog | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("agent_logs").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50).then(({ data }) => setLogs(data || []));

    const channel = supabase
      .channel(`agent-logs-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_logs", filter: `org_id=eq.${orgId}` }, (payload) => {
        setLogs((prev) => [payload.new as AgentLog, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  const logsByAgent = (type: string) => logs.filter(l => l.agent_type === type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">AI Agents</h1>
        <p className="text-muted-foreground mt-1">Multi-agent system for organizational intelligence. Click actions to view thought processes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(a => {
          const config = agentConfig[a.type];
          const agentLogs = logsByAgent(a.type);
          const isExpanded = expandedAgent === a.type;
          return (
            <div key={a.name} className={`glass-panel p-6 border ${config.borderColor}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold font-display">{a.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Active</span>
                  <span className="text-xs text-muted-foreground">{agentLogs.length} actions</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{a.desc}</p>

              {agentLogs.length > 0 && (
                <div className="space-y-2">
                  <button onClick={() => setExpandedAgent(isExpanded ? null : a.type)} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase hover:text-foreground transition-colors">
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Recent Actions ({agentLogs.length})
                  </button>
                  {(isExpanded ? agentLogs : agentLogs.slice(0, 3)).map(log => (
                    <button key={log.id} onClick={() => setSelectedLog(log)} className="w-full text-left p-2 rounded bg-muted/30 border border-border/30 hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{log.action.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-2">
                          {log.duration_ms && <span className="text-[10px] text-muted-foreground">{log.duration_ms}ms</span>}
                          <span className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), "MMM d")}</span>
                        </div>
                      </div>
                      {log.output_summary && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{log.output_summary}</p>}
                      {log.reasoning && <p className="text-[10px] text-primary/60 mt-1 italic line-clamp-1">💭 {log.reasoning}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent thought process dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Agent Thought Process
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Agent:</span> <span className="capitalize ml-1">{agentConfig[selectedLog.agent_type]?.label || selectedLog.agent_type}</span></div>
                <div><span className="text-muted-foreground">Action:</span> <span className="ml-1">{selectedLog.action.replace(/_/g, " ")}</span></div>
                {selectedLog.duration_ms && <div><span className="text-muted-foreground">Duration:</span> <span className="ml-1">{selectedLog.duration_ms}ms</span></div>}
                <div><span className="text-muted-foreground">Time:</span> <span className="ml-1">{format(new Date(selectedLog.created_at), "PPpp")}</span></div>
              </div>

              {selectedLog.input_summary && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Input</h4>
                  <p className="text-sm">{selectedLog.input_summary}</p>
                </div>
              )}

              {selectedLog.reasoning && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="text-xs font-semibold text-primary uppercase mb-1">💭 Reasoning</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedLog.reasoning}</p>
                </div>
              )}

              {selectedLog.output_summary && (
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <h4 className="text-xs font-semibold text-accent uppercase mb-1">Output</h4>
                  <p className="text-sm">{selectedLog.output_summary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
