import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { MessageSquare, Mail, Video } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  source_type: string;
  sender_name: string;
  content: string;
  subject: string | null;
  channel: string | null;
  recipients: string[];
  created_at: string;
  metadata: any;
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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("messages")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMessages((data as Message[]) || []));
  }, [orgId]);

  const filtered = filter === "all" ? messages : messages.filter(m => m.source_type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Messages</h1>
        <p className="text-muted-foreground mt-1">Unified view of communications across Slack, Email, and meetings.</p>
      </div>

      <div className="flex gap-2">
        {["all", "slack", "email", "meeting_transcript"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "meeting_transcript" ? "Meetings" : f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(msg => {
          const Icon = sourceIcons[msg.source_type] || MessageSquare;
          const colorClass = sourceColors[msg.source_type] || "bg-muted text-muted-foreground";
          return (
            <button
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className="glass-panel p-4 w-full text-left hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer"
            >
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
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.content}</p>
                  {msg.recipients && msg.recipients.length > 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-1">To: {msg.recipients.join(", ")}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No messages found.</p>
          </div>
        )}
      </div>

      {/* Message detail dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && (() => { const Icon = sourceIcons[selectedMessage.source_type] || MessageSquare; return <Icon className="h-5 w-5 text-primary" />; })()}
              {selectedMessage?.subject || `Message from ${selectedMessage?.sender_name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">From:</span> <span className="ml-1 font-medium">{selectedMessage.sender_name}</span></div>
                <div><span className="text-muted-foreground">Source:</span> <span className="ml-1 capitalize">{selectedMessage.source_type.replace(/_/g, " ")}</span></div>
                {selectedMessage.channel && <div><span className="text-muted-foreground">Channel:</span> <span className="ml-1">{selectedMessage.channel}</span></div>}
                <div><span className="text-muted-foreground">Date:</span> <span className="ml-1">{format(new Date(selectedMessage.created_at), "PPp")}</span></div>
                {selectedMessage.recipients && selectedMessage.recipients.length > 0 && (
                  <div className="col-span-2"><span className="text-muted-foreground">To:</span> <span className="ml-1">{selectedMessage.recipients.join(", ")}</span></div>
                )}
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
