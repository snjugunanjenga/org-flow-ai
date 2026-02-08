import { MessageSquare } from "lucide-react";

export default function MessagesView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Messages</h1>
        <p className="text-muted-foreground mt-1">Unified view of communications across Slack, Gmail, and meetings.</p>
      </div>
      <div className="glass-panel p-12 flex flex-col items-center justify-center min-h-[400px]">
        <MessageSquare className="h-16 w-16 text-primary/30 mb-4" />
        <h3 className="text-lg font-semibold font-display mb-2">Communication Feed</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect Slack and Gmail integrations to see messages, extract decisions, and route knowledge automatically.
        </p>
      </div>
    </div>
  );
}
