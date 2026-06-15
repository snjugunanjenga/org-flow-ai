import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { Bell, CheckCircle, AlertTriangle, Info, Play, Loader2, Volume2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoiceCoordinatorButton } from "@/components/dashboard/VoiceCoordinatorButton";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  reasoning: string | null;
  source_agent: string | null;
  agent_type: string | null;
  voice_enabled: boolean | null;
  voice_audio_url: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  warning: { icon: AlertTriangle, color: "text-[hsl(40_90%_55%)] bg-[hsl(40_90%_55%)]/10" },
  success: { icon: CheckCircle, color: "text-accent bg-accent/10" },
  info: { icon: Info, color: "text-primary bg-primary/10" },
};

export default function NotificationsView() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotifications((data as Notification[]) || []));
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const playVoice = async (n: Notification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingId) return;
    setPlayingId(n.id);
    try {
      const text = `${n.title}. ${n.body}`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text, agent: n.agent_type ?? n.source_agent ?? "coordinator" }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Voice unavailable", description: err?.error ?? `HTTP ${res.status}` });
        return;
      }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      await audio.play();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Playback failed", description: e?.message ?? String(e) });
      setPlayingId(null);
    }
  };

  const unread = notifications.filter(n => !n.read);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-display">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            AI-routed notifications with reasoning context.
            {unread.length > 0 && <span className="ml-2 text-destructive font-medium">{unread.length} unread</span>}
          </p>
        </div>
        <VoiceCoordinatorButton />
      </div>

      <div className="space-y-3">
        {notifications.map(n => {
          const config = typeConfig[n.type] || typeConfig.info;
          const Icon = config.icon;
          const canPlay = n.voice_enabled || !!n.source_agent;
          const isPlaying = playingId === n.id;
          return (
            <button
              key={n.id}
              onClick={() => { setSelectedNotif(n); if (!n.read) markRead(n.id); }}
              className={`glass-panel p-4 w-full text-left transition-all hover:ring-1 hover:ring-primary/30 cursor-pointer ${!n.read ? "ring-1 ring-primary/20" : "opacity-70"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(n.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {n.source_agent && <p className="text-[10px] text-primary/60">via {n.source_agent} Agent</p>}
                    {canPlay && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={(e) => playVoice(n, e)}
                        disabled={!!playingId}
                      >
                        {isPlaying
                          ? <><Volume2 className="h-3 w-3 animate-pulse" /> Playing…</>
                          : playingId
                            ? <><Loader2 className="h-3 w-3 animate-spin" /> Wait…</>
                            : <><Play className="h-3 w-3" /> Play voice</>}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {notifications.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        )}
      </div>

      {/* Notification detail dialog */}
      <Dialog open={!!selectedNotif} onOpenChange={() => setSelectedNotif(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedNotif?.title}</DialogTitle></DialogHeader>
          {selectedNotif && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <span className="capitalize ml-1">{selectedNotif.type}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="ml-1">{format(new Date(selectedNotif.created_at), "PPp")}</span></div>
                {selectedNotif.source_agent && <div className="col-span-2"><span className="text-muted-foreground">Source Agent:</span> <span className="capitalize ml-1">{selectedNotif.source_agent}</span></div>}
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-sm whitespace-pre-wrap">{selectedNotif.body}</p>
              </div>
              {selectedNotif.reasoning && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="text-xs font-semibold text-primary uppercase mb-1">💭 AI Reasoning</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedNotif.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
