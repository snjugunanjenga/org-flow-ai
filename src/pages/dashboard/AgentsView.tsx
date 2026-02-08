import { Brain } from "lucide-react";

const agents = [
  { name: "Memory Agent", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", desc: "Extracts entities, generates embeddings, maintains organizational memory.", status: "Active" },
  { name: "Router Agent", color: "bg-green-500/10 text-green-500 border-green-500/20", desc: "Identifies stakeholders, routes critical information to the right people.", status: "Active" },
  { name: "Critic Agent", color: "bg-red-500/10 text-red-500 border-red-500/20", desc: "Detects conflicts, contradictions, and misalignment across decisions.", status: "Active" },
  { name: "Coordinator Agent", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", desc: "Orchestrates agent responses, manages user interactions.", status: "Active" },
];

export default function AgentsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">AI Agents</h1>
        <p className="text-muted-foreground mt-1">Multi-agent system for organizational intelligence.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((a) => (
          <div key={a.name} className={`glass-panel p-6 border ${a.color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold font-display">{a.name}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">{a.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">{a.desc}</p>
          </div>
        ))}
      </div>
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">Agent Reasoning Traces</h3>
        <p className="text-sm text-muted-foreground">Real-time reasoning logs from all agents will appear here. Connect the AI system to see live traces.</p>
      </div>
    </div>
  );
}
