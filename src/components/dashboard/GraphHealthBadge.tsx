import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Health = {
  ok: boolean;
  neo4j: { ok: boolean; latency_ms: number; error?: string };
  pinecone: { ok: boolean; latency_ms: number; vectors?: number; error?: string };
  checked_at: string;
};

export function GraphHealthBadge() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("graph-healthcheck", { body: {} });
    setLoading(false);
    if (error) {
      setHealth({ ok: false, neo4j: { ok: false, latency_ms: 0, error: error.message }, pinecone: { ok: false, latency_ms: 0 }, checked_at: new Date().toISOString() });
      return;
    }
    setHealth(data as Health);
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const Icon = loading ? Loader2 : health?.ok ? CheckCircle2 : AlertCircle;
  const color = health?.ok ? "text-accent" : loading ? "text-muted-foreground" : "text-destructive";
  const label = loading
    ? "Checking…"
    : health?.ok
      ? "Graph + Vectors OK"
      : "Graph backend degraded";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={check}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-card/40 text-xs ${color} hover:bg-card/60 transition-colors`}
          >
            <Icon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-xs">
          <div className="space-y-1">
            <div>
              <strong>Neo4j:</strong>{" "}
              {health?.neo4j.ok ? `OK (${health.neo4j.latency_ms} ms)` : health?.neo4j.error || "fail"}
            </div>
            <div>
              <strong>Pinecone:</strong>{" "}
              {health?.pinecone.ok
                ? `OK (${health.pinecone.latency_ms} ms · ${health.pinecone.vectors ?? 0} vectors)`
                : health?.pinecone.error || "fail"}
            </div>
            <div className="text-muted-foreground">Auto-refreshes every 30s. Click to recheck.</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}