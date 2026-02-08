import { AlertTriangle } from "lucide-react";

export default function TopicsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Topics & Decisions</h1>
        <p className="text-muted-foreground mt-1">Tracked decisions, extracted topics, and conflict detection.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Active Topics</h3>
          <p className="text-sm text-muted-foreground">Topics extracted by the Memory Agent from communications will appear here.</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Conflicts & Contradictions</h3>
          <p className="text-sm text-muted-foreground">The Critic Agent will flag misalignments and contradictions here.</p>
        </div>
      </div>
    </div>
  );
}
