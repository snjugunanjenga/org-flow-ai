import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { MessageSquare, Mail, Video } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  source_type: string;
  sender_name: string;
  content: string;
  subject: string | null;
  channel: string | null;
  recipients: string[];
  created_at: string;
}

const sourceIcons: Record<string, any> = {
  slack: MessageSquare,
  email: Mail,
  meeting_transcript: Video,
};

const sourceColors: Record<string, string> = {
  slack: "bg-primary/10 text-primary",
  email: "bg-accent/10 text-accent",
  meeting_transcript: "bg-[hsl(var(--graph-node-meeting))]/10 text-[hsl(var(--graph-node-meeting))]",
};

export default function MessagesView() {
  const orgId = useOrgId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("messages")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMessages(data || []));
  }, [orgId]);

  const filtered = filter === "all" ? messages : messages.filter(m => m.source_type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Messages</h1>
        <p className="text-muted-foreground mt-1">Unified view of communications across Slack, Email, and meetings.</p>
      </div>

      <div className="flex gap-2">
        {["all", "slack", "email"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(msg => {
          const Icon = sourceIcons[msg.source_type] || MessageSquare;
          const colorClass = sourceColors[msg.source_type] || "bg-muted text-muted-foreground";
          return (
            <div key={msg.id} className="glass-panel p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{msg.sender_name}</span>
                      {msg.channel && <span className="text-xs text-muted-foreground">{msg.channel}</span>}
                      {msg.subject && <span className="text-xs text-muted-foreground">— {msg.subject}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{msg.content}</p>
                  {msg.recipients && msg.recipients.length > 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-1">To: {msg.recipients.join(", ")}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No messages found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
