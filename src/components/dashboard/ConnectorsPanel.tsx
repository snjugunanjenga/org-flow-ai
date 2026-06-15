import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plug, RefreshCcw } from "lucide-react";
import { format } from "date-fns";

type Sub = {
  id: string;
  connector: "slack" | "gmail" | "calendar";
  external_id: string | null;
  label: string | null;
  enabled: boolean;
  last_synced_at: string | null;
};

const CONNECTOR_META: Record<Sub["connector"], { name: string; placeholder: string; fn: string }> = {
  slack: { name: "Slack", placeholder: "Channel ID (e.g. C0123ABCDEF)", fn: "connector-slack-ingest" },
  gmail: { name: "Gmail", placeholder: "Label (e.g. INBOX)", fn: "connector-gmail-ingest" },
  calendar: { name: "Google Calendar", placeholder: "Calendar ID (e.g. primary)", fn: "calendar-sync" },
};

export function ConnectorsPanel() {
  const orgId = useOrgId();
  const { toast } = useToast();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [newConnector, setNewConnector] = useState<Sub["connector"]>("slack");
  const [newExternal, setNewExternal] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = async () => {
    if (!orgId) return;
    const { data } = await supabase.from("connector_subscriptions").select("id,connector,external_id,label,enabled,last_synced_at").eq("org_id", orgId).order("created_at", { ascending: false });
    setSubs((data ?? []) as Sub[]);
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [orgId]);

  const addSub = async () => {
    if (!orgId || !newExternal.trim()) return;
    const { error } = await supabase.from("connector_subscriptions").insert({
      org_id: orgId, connector: newConnector, external_id: newExternal.trim(), label: newConnector === "gmail" ? newExternal.trim() : null,
    });
    if (error) toast({ variant: "destructive", title: "Could not add", description: error.message });
    else { toast({ title: "Subscription added" }); setNewExternal(""); load(); }
  };

  const toggle = async (s: Sub) => {
    await supabase.from("connector_subscriptions").update({ enabled: !s.enabled }).eq("id", s.id);
    load();
  };

  const runSync = async (s: Sub) => {
    setSyncing(s.id);
    try {
      const { error } = await supabase.functions.invoke(CONNECTOR_META[s.connector].fn, { body: {} });
      if (error) throw error;
      toast({ title: `${CONNECTOR_META[s.connector].name} sync started` });
      load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync failed", description: e.message ?? "Unknown error" });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Plug className="h-5 w-5 text-primary" />
        <h3 className="font-semibold font-display">Connectors</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Pipe Slack, Gmail, or Calendar signals into the Memory Agent. Manager and admin roles required.
      </p>

      <div className="space-y-2">
        {subs.length === 0 && <p className="text-xs text-muted-foreground">No subscriptions yet.</p>}
        {subs.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/40">
            <div className="min-w-0">
              <p className="text-sm font-medium">{CONNECTOR_META[s.connector].name} · <span className="font-mono text-xs text-muted-foreground">{s.external_id}</span></p>
              <p className="text-[11px] text-muted-foreground">{s.last_synced_at ? `Last sync ${format(new Date(s.last_synced_at), "MMM d HH:mm")}` : "Never synced"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={s.enabled} onCheckedChange={() => toggle(s)} aria-label={`Toggle ${s.connector}`} />
              <Button size="sm" variant="outline" onClick={() => runSync(s)} disabled={syncing === s.id}>
                {syncing === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 pt-2 border-t border-border/50">
        <div>
          <label htmlFor="connector-type" className="text-xs text-muted-foreground">Connector</label>
          <select id="connector-type" value={newConnector} onChange={(e) => setNewConnector(e.target.value as Sub["connector"]) } className="block mt-1 bg-muted/40 rounded-md text-sm px-2 py-1.5 border border-border/50">
            <option value="slack">Slack</option>
            <option value="gmail">Gmail</option>
            <option value="calendar">Calendar</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="connector-external" className="text-xs text-muted-foreground">Identifier</label>
          <Input id="connector-external" value={newExternal} onChange={(e) => setNewExternal(e.target.value)} placeholder={CONNECTOR_META[newConnector].placeholder} />
        </div>
        <Button onClick={addSub} disabled={!newExternal.trim()}>Add</Button>
      </div>
    </div>
  );
}