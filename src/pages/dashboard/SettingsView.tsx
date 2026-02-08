import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Plug, Brain, Save, Loader2 } from "lucide-react";

export default function SettingsView() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({ display_name: "", job_title: "", department: "", avatar_url: "" });
  // Org state
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  // Integration toggles
  const [integrations, setIntegrations] = useState({ slack: false, gmail: false, calendar: false, neo4j: false, pinecone: false });
  // AI agent config
  const [agentConfig, setAgentConfig] = useState({
    memoryEnabled: true, routerEnabled: true, criticEnabled: true,
    conflictThreshold: "medium",
    autoNotify: true,
    summaryFrequency: "daily",
  });

  useEffect(() => {
    if (!user) return;
    // Load profile
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({ display_name: data.display_name || "", job_title: data.job_title || "", department: data.department || "", avatar_url: data.avatar_url || "" });
    });
    // Load org
    if (orgId) {
      supabase.from("organizations").select("name, slug").eq("id", orgId).maybeSingle().then(({ data }) => {
        if (data) { setOrgName(data.name); setOrgSlug(data.slug); }
      });
    }
  }, [user, orgId]);

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name.trim() || null,
      job_title: profile.job_title.trim() || null,
      department: profile.department.trim() || null,
      avatar_url: profile.avatar_url.trim() || null,
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Profile saved" });
  };

  const saveOrg = async () => {
    if (!orgId) return;
    setLoading(true);
    const { error } = await supabase.from("organizations").update({ name: orgName.trim() }).eq("id", orgId);
    setLoading(false);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Organization updated" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground mt-1">Organization, profile, integrations, and AI configuration.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-1"><User className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-1"><Building2 className="h-4 w-4" /> Organization</TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1"><Plug className="h-4 w-4" /> Integrations</TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1"><Brain className="h-4 w-4" /> AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="glass-panel p-6 max-w-xl space-y-4">
            <h3 className="text-lg font-semibold font-display">Your Profile</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Display Name</Label>
                <Input value={profile.display_name} onChange={e => setProfile({ ...profile, display_name: e.target.value })} className="bg-secondary/50" />
              </div>
              <div className="space-y-1">
                <Label>Job Title</Label>
                <Input value={profile.job_title} onChange={e => setProfile({ ...profile, job_title: e.target.value })} placeholder="e.g. VP of Engineering" className="bg-secondary/50" />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} placeholder="e.g. Engineering" className="bg-secondary/50" />
              </div>
              <div className="space-y-1">
                <Label>Avatar URL</Label>
                <Input value={profile.avatar_url} onChange={e => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://..." className="bg-secondary/50" />
              </div>
              <div className="text-xs text-muted-foreground">Email: {user?.email}</div>
              <Button onClick={saveProfile} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save Profile</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organization" className="mt-6">
          <div className="glass-panel p-6 max-w-xl space-y-4">
            <h3 className="text-lg font-semibold font-display">Organization</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Organization Name</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input value={orgSlug} disabled className="bg-muted/50 text-muted-foreground" />
              </div>
              <Button onClick={saveOrg} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="glass-panel p-6 max-w-xl space-y-4">
            <h3 className="text-lg font-semibold font-display">Integrations</h3>
            <p className="text-sm text-muted-foreground mb-4">Connect your tools. API keys are managed securely via backend secrets.</p>
            {[
              { key: "slack", label: "Slack", desc: "Real-time message ingestion from Slack channels" },
              { key: "gmail", label: "Gmail", desc: "Email thread analysis and knowledge extraction" },
              { key: "calendar", label: "Google Calendar", desc: "Meeting detection and transcript ingestion" },
              { key: "neo4j", label: "Neo4j (Graph DB)", desc: "Knowledge graph storage and traversal" },
              { key: "pinecone", label: "Pinecone (Vector DB)", desc: "Semantic memory and similarity search" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={integrations[item.key as keyof typeof integrations]}
                  onCheckedChange={v => setIntegrations({ ...integrations, [item.key]: v })}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              Slack and Google integrations require API keys. Contact your admin to configure credentials.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <div className="glass-panel p-6 max-w-xl space-y-4">
            <h3 className="text-lg font-semibold font-display">AI Agent Configuration</h3>
            <p className="text-sm text-muted-foreground mb-4">Configure agent behaviors and notification preferences.</p>
            {[
              { key: "memoryEnabled", label: "Memory Agent", desc: "Entity extraction and organizational memory" },
              { key: "routerEnabled", label: "Router Agent", desc: "Stakeholder identification and routing" },
              { key: "criticEnabled", label: "Critic Agent", desc: "Conflict detection and contradiction alerts" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={agentConfig[item.key as keyof typeof agentConfig] as boolean}
                  onCheckedChange={v => setAgentConfig({ ...agentConfig, [item.key]: v })}
                />
              </div>
            ))}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-notify on conflicts</p>
                  <p className="text-xs text-muted-foreground">Send notifications when new conflicts are detected</p>
                </div>
                <Switch checked={agentConfig.autoNotify} onCheckedChange={v => setAgentConfig({ ...agentConfig, autoNotify: v })} />
              </div>
              <div className="space-y-1">
                <Label>Conflict Detection Threshold</Label>
                <select
                  value={agentConfig.conflictThreshold}
                  onChange={e => setAgentConfig({ ...agentConfig, conflictThreshold: e.target.value })}
                  className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
                >
                  <option value="low">Low — Flag minor disagreements</option>
                  <option value="medium">Medium — Flag potential conflicts</option>
                  <option value="high">High — Only flag critical conflicts</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>AI Summary Frequency</Label>
                <select
                  value={agentConfig.summaryFrequency}
                  onChange={e => setAgentConfig({ ...agentConfig, summaryFrequency: e.target.value })}
                  className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
                >
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                </select>
              </div>
            </div>
            <Button onClick={() => toast({ title: "Agent configuration saved" })}><Save className="h-4 w-4 mr-1" /> Save Configuration</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
