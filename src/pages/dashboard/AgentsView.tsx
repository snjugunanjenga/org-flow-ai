import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { Brain } from "lucide-react";
import { format } from "date-fns";

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

const agentConfig: Record<string, { color: string; borderColor: string }> = {
  memory: { color: "bg-[hsl(var(--agent-memory))]/10 text-[hsl(var(--agent-memory))]", borderColor: "border-[hsl(var(--agent-memory))]/20" },
  router: { color: "bg-[hsl(var(--agent-router))]/10 text-[hsl(var(--agent-router))]", borderColor: "border-[hsl(var(--agent-router))]/20" },
  critic: { color: "bg-[hsl(var(--agent-critic))]/10 text-[hsl(var(--agent-critic))]", borderColor: "border-[hsl(var(--agent-critic))]/20" },
  coordinator: { color: "bg-[hsl(var(--agent-coordinator))]/10 text-[hsl(var(--agent-coordinator))]", borderColor: "border-[hsl(var(--agent-coordinator))]/20" },
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

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("agent_logs")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setLogs(data || []));
  }, [orgId]);

  const logsByAgent = (type: string) => logs.filter(l => l.agent_type === type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">AI Agents</h1>
        <p className="text-muted-foreground mt-1">Multi-agent system for organizational intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(a => {
          const config = agentConfig[a.type];
          const agentLogs = logsByAgent(a.type);
          return (
            <div key={a.name} className={`glass-panel p-6 border ${config.borderColor}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold font-display">{a.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">Active</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{a.desc}</p>
              
              {agentLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Recent Actions</h4>
                  {agentLogs.slice(0, 3).map(log => (
                    <div key={log.id} className="p-2 rounded bg-muted/30 border border-border/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{log.action.replace(/_/g, " ")}</span>
                        {log.duration_ms && <span className="text-[10px] text-muted-foreground">{log.duration_ms}ms</span>}
                      </div>
                      {log.output_summary && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{log.output_summary}</p>
                      )}
                      {log.reasoning && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1 italic line-clamp-1">{log.reasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
