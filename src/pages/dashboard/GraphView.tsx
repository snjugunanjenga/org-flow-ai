import { Network } from "lucide-react";

export default function GraphView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Knowledge Graph</h1>
        <p className="text-muted-foreground mt-1">Interactive 3D visualization of organizational knowledge.</p>
      </div>
      <div className="glass-panel p-12 flex flex-col items-center justify-center min-h-[500px]">
        <Network className="h-16 w-16 text-primary/30 mb-4" />
        <h3 className="text-lg font-semibold font-display mb-2">3D Knowledge Graph</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect Neo4j to visualize people, topics, decisions, and projects as an interactive force-directed graph.
        </p>
      </div>
    </div>
  );
}
