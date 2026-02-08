import { Settings } from "lucide-react";

export default function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground mt-1">Organization and integration configuration.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Organization</h3>
          <p className="text-sm text-muted-foreground">Manage organization name, slug, and membership settings.</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Integrations</h3>
          <p className="text-sm text-muted-foreground">Connect Slack, Gmail, Google Calendar, Neo4j, and Pinecone.</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">AI Agents</h3>
          <p className="text-sm text-muted-foreground">Configure agent behaviors, thresholds, and notification preferences.</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Profile</h3>
          <p className="text-sm text-muted-foreground">Update your personal profile, display name, and notification preferences.</p>
        </div>
      </div>
    </div>
  );
}
