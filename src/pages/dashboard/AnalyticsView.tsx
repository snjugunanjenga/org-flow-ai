import { BarChart3 } from "lucide-react";

export default function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Analytics</h1>
        <p className="text-muted-foreground mt-1">Organizational intelligence metrics and insights.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5">
          <p className="text-xs text-muted-foreground mb-1">Decisions Tracked</p>
          <p className="text-2xl font-bold font-display">—</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs text-muted-foreground mb-1">Conflicts Detected</p>
          <p className="text-2xl font-bold font-display">—</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs text-muted-foreground mb-1">Knowledge Nodes</p>
          <p className="text-2xl font-bold font-display">—</p>
        </div>
      </div>
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">Trends</h3>
        <div className="flex items-center justify-center py-12">
          <BarChart3 className="h-16 w-16 text-muted-foreground/20" />
        </div>
        <p className="text-sm text-muted-foreground text-center">Charts and trend analysis will be populated when data integrations are connected.</p>
      </div>
    </div>
  );
}
