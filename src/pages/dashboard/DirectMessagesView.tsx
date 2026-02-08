import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, MessageCircle, Hash } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  team_id: string | null;
  content: string;
  is_team_message: boolean;
  created_at: string;
}

interface Member {
  user_id: string;
  display_name: string | null;
}

interface Team {
  id: string;
  name: string;
  color: string | null;
}

type Channel = { type: "user"; id: string; name: string } | { type: "team"; id: string; name: string; color: string | null };

export default function DirectMessagesView() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!orgId || !user) return;
    const [{ data: msgs }, { data: mems }, { data: tms }] = await Promise.all([
      supabase.from("direct_messages").select("*").eq("org_id", orgId).order("created_at"),
      supabase.from("org_memberships").select("user_id").eq("org_id", orgId),
      supabase.from("teams").select("id, name, color").eq("org_id", orgId),
    ]);
    setMessages((msgs as DirectMessage[]) || []);
    setTeams(tms || []);
    if (mems) {
      const ids = mems.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      setMembers(profiles || []);
    }
  };

  useEffect(() => { loadData(); }, [orgId, user]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, selectedChannel]);

  const channels: Channel[] = [
    ...members.filter(m => m.user_id !== user?.id).map(m => ({ type: "user" as const, id: m.user_id, name: m.display_name || "Unknown" })),
    ...teams.map(t => ({ type: "team" as const, id: t.id, name: t.name, color: t.color })),
  ];

  const filteredMessages = selectedChannel
    ? messages.filter(m => {
        if (selectedChannel.type === "user") {
          return !m.is_team_message && (
            (m.sender_id === user?.id && m.recipient_id === selectedChannel.id) ||
            (m.sender_id === selectedChannel.id && m.recipient_id === user?.id)
          );
        }
        return m.is_team_message && m.team_id === selectedChannel.id;
      })
    : [];

  const getMemberName = (id: string) => members.find(m => m.user_id === id)?.display_name || "Unknown";

  const sendMessage = async () => {
    if (!input.trim() || !user || !orgId || !selectedChannel) return;
    const msg: any = {
      org_id: orgId,
      sender_id: user.id,
      content: input.trim(),
    };
    if (selectedChannel.type === "user") {
      msg.recipient_id = selectedChannel.id;
      msg.is_team_message = false;
    } else {
      msg.team_id = selectedChannel.id;
      msg.is_team_message = true;
    }
    const { error } = await supabase.from("direct_messages").insert(msg);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    setInput("");
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Direct Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with team members and channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-240px)]">
        {/* Channel list */}
        <div className="glass-panel p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">People</h3>
          <div className="space-y-1">
            {channels.filter(c => c.type === "user").map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChannel(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedChannel?.id === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 mt-6">Teams</h3>
          <div className="space-y-1">
            {channels.filter(c => c.type === "team").map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChannel(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedChannel?.id === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3 glass-panel flex flex-col">
          {selectedChannel ? (
            <>
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                {selectedChannel.type === "user" ? <MessageCircle className="h-4 w-4 text-primary" /> : <Hash className="h-4 w-4 text-primary" />}
                <h3 className="text-sm font-semibold">{selectedChannel.name}</h3>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredMessages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/60 rounded-bl-sm"}`}>
                        {!isMe && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{getMemberName(msg.sender_id)}</p>}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] opacity-50 mt-0.5">{format(new Date(msg.created_at), "h:mm a")}</p>
                      </div>
                    </div>
                  );
                })}
                {filteredMessages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={`Message ${selectedChannel.name}...`}
                    className="bg-muted/50"
                  />
                  <button onClick={sendMessage} disabled={!input.trim()} className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Select a person or team to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
