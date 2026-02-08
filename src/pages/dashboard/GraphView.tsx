import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { Network } from "lucide-react";

interface GraphEdge {
  id: string;
  source_type: string;
  source_label: string;
  target_type: string;
  target_label: string;
  relationship: string;
  weight: number;
}

const typeColors: Record<string, string> = {
  person: "bg-[hsl(var(--graph-node-person))]",
  topic: "bg-[hsl(var(--graph-node-topic))]",
  decision: "bg-[hsl(var(--graph-node-decision))]",
  project: "bg-[hsl(var(--graph-node-project))]",
  meeting: "bg-[hsl(var(--graph-node-meeting))]",
};

const typeBorders: Record<string, string> = {
  person: "border-[hsl(var(--graph-node-person))]",
  topic: "border-[hsl(var(--graph-node-topic))]",
  decision: "border-[hsl(var(--graph-node-decision))]",
  project: "border-[hsl(var(--graph-node-project))]",
  meeting: "border-[hsl(var(--graph-node-meeting))]",
};

export default function GraphView() {
  const orgId = useOrgId();
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("graph_edges")
      .select("*")
      .eq("org_id", orgId)
      .then(({ data }) => setEdges(data || []));
  }, [orgId]);

  // Build unique nodes
  const nodesMap = new Map<string, { type: string; label: string; connections: number }>();
  edges.forEach(e => {
    const sKey = `${e.source_type}:${e.source_label}`;
    const tKey = `${e.target_type}:${e.target_label}`;
    if (!nodesMap.has(sKey)) nodesMap.set(sKey, { type: e.source_type, label: e.source_label, connections: 0 });
    if (!nodesMap.has(tKey)) nodesMap.set(tKey, { type: e.target_type, label: e.target_label, connections: 0 });
    nodesMap.get(sKey)!.connections++;
    nodesMap.get(tKey)!.connections++;
  });

  const nodes = Array.from(nodesMap.values()).sort((a, b) => b.connections - a.connections);
  const filteredNodes = selectedType === "all" ? nodes : nodes.filter(n => n.type === selectedType);
  const filteredEdges = selectedType === "all" ? edges : edges.filter(e => e.source_type === selectedType || e.target_type === selectedType);

  const types = ["all", ...new Set(nodes.map(n => n.type))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-1">{nodes.length} entities, {edges.length} relationships</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              selectedType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Node grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredNodes.map((node, i) => (
          <div key={i} className={`glass-panel p-4 border-l-4 ${typeBorders[node.type] || "border-border"}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${typeColors[node.type] || "bg-muted"}`} />
              <span className="text-xs uppercase text-muted-foreground">{node.type}</span>
            </div>
            <h4 className="text-sm font-semibold">{node.label}</h4>
            <p className="text-[10px] text-muted-foreground mt-1">{node.connections} connections</p>
          </div>
        ))}
      </div>

      {/* Relationships */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">Relationships ({filteredEdges.length})</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredEdges.map(e => (
            <div key={e.id} className="flex items-center gap-2 py-1.5 text-sm border-b border-border/20 last:border-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${typeColors[e.source_type] || "bg-muted"}`} />
              <span className="font-medium">{e.source_label}</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/50">{e.relationship}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${typeColors[e.target_type] || "bg-muted"}`} />
              <span className="font-medium">{e.target_label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
