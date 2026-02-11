import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ForceGraph } from "@/components/graph/ForceGraph";
import { ChevronDown } from "lucide-react";

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

interface NodeInfo {
  type: string;
  label: string;
  connections: number;
  relatedEdges: GraphEdge[];
}

export default function GraphView() {
  const orgId = useOrgId();
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [relOpen, setRelOpen] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("graph_edges").select("*").eq("org_id", orgId).then(({ data }) => setEdges(data || []));
  }, [orgId]);

  const nodesMap = new Map<string, NodeInfo>();
  edges.forEach(e => {
    const sKey = `${e.source_type}:${e.source_label}`;
    const tKey = `${e.target_type}:${e.target_label}`;
    if (!nodesMap.has(sKey)) nodesMap.set(sKey, { type: e.source_type, label: e.source_label, connections: 0, relatedEdges: [] });
    if (!nodesMap.has(tKey)) nodesMap.set(tKey, { type: e.target_type, label: e.target_label, connections: 0, relatedEdges: [] });
    nodesMap.get(sKey)!.connections++;
    nodesMap.get(sKey)!.relatedEdges.push(e);
    nodesMap.get(tKey)!.connections++;
    nodesMap.get(tKey)!.relatedEdges.push(e);
  });

  const nodes = Array.from(nodesMap.values()).sort((a, b) => b.connections - a.connections);
  const filteredNodes = selectedType === "all" ? nodes : nodes.filter(n => n.type === selectedType);
  const filteredEdges = selectedType === "all" ? edges : edges.filter(e => e.source_type === selectedType || e.target_type === selectedType);
  const types = ["all", ...new Set(nodes.map(n => n.type))];

  const handleNodeClick = (node: { type: string; label: string; connections: number }) => {
    const full = nodesMap.get(`${node.type}:${node.label}`);
    if (full) setSelectedNode(full);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-1">{nodes.length} entities, {edges.length} relationships</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setSelectedType(t)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${selectedType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Force-directed graph canvas */}
      <ForceGraph
        nodes={filteredNodes}
        edges={filteredEdges}
        typeColors={typeColors}
        onNodeClick={handleNodeClick}
      />

      {/* Collapsible relationships list */}
      <Collapsible open={relOpen} onOpenChange={setRelOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold font-display hover:text-primary transition-colors">
          <ChevronDown className={`h-4 w-4 transition-transform ${relOpen ? "rotate-180" : ""}`} />
          Relationships ({filteredEdges.length})
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="glass-panel p-6 mt-2">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Node detail dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${typeColors[selectedNode?.type || ""] || "bg-muted"}`} />
              {selectedNode?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <span className="capitalize ml-1">{selectedNode.type}</span></div>
                <div><span className="text-muted-foreground">Connections:</span> <span className="ml-1">{selectedNode.connections}</span></div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Related Relationships</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedNode.relatedEdges.map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                      <span className={`w-2 h-2 rounded-full ${typeColors[e.source_type] || "bg-muted"}`} />
                      <span>{e.source_label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{e.relationship}</span>
                      <span className={`w-2 h-2 rounded-full ${typeColors[e.target_type] || "bg-muted"}`} />
                      <span>{e.target_label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
