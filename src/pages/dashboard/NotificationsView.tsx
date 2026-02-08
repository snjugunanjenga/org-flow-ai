import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  reasoning: string | null;
  source_agent: string | null;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data || []));
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          AI-routed notifications with reasoning context.
          {unread.length > 0 && <span className="ml-2 text-destructive font-medium">{unread.length} unread</span>}
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map(n => {
          const config = typeConfig[n.type] || typeConfig.info;
          const Icon = config.icon;
          return (
            <div key={n.id} className={`glass-panel p-4 transition-all ${!n.read ? "ring-1 ring-primary/20" : "opacity-70"}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{n.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(n.created_at), "MMM d, h:mm a")}
                      </span>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  {n.reasoning && (
                    <div className="mt-2 p-2 rounded bg-muted/50 border border-border/30">
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-semibold capitalize">{n.source_agent} Agent:</span> {n.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
