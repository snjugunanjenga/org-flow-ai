import { Eye } from "lucide-react";

export default function OversightView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Manager Oversight</h1>
        <p className="text-muted-foreground mt-1">Communication analytics and team health monitoring.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Communication Patterns</h3>
          <p className="text-sm text-muted-foreground">Aggregated communication metrics across teams — frequency, response times, cross-team collaboration scores.</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Team Health</h3>
          <p className="text-sm text-muted-foreground">AI-detected sentiment trends, engagement levels, and potential bottlenecks.</p>
        </div>
      </div>
    </div>
  );
}
