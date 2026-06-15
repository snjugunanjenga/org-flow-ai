import { useCallback, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Mic button that opens a full-duplex ElevenLabs voice conversation with the Coordinator agent. */
export function VoiceCoordinatorButton() {
  const [starting, setStarting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onError: (err) => {
      console.error("Conversation error:", err);
      toast({ variant: "destructive", title: "Voice agent error", description: String(err) });
    },
  });

  const start = useCallback(async () => {
    setStarting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke("voice-agent-token", { body: {} });
      if (error || !data?.token) {
        toast({
          variant: "destructive",
          title: "Voice agent not configured",
          description: "Create a Conversational AI agent in your ElevenLabs dashboard, then set ELEVENLABS_AGENT_ID.",
        });
        return;
      }
      await conversation.startSession({ conversationToken: data.token, connectionType: "webrtc" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Mic blocked", description: e?.message ?? "Allow microphone access." });
    } finally {
      setStarting(false);
    }
  }, [conversation, toast]);

  const stop = useCallback(() => conversation.endSession(), [conversation]);

  const connected = conversation.status === "connected";

  return (
    <Button
      size="sm"
      variant={connected ? "destructive" : "outline"}
      onClick={connected ? stop : start}
      disabled={starting}
      className="gap-2"
    >
      {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : connected ? <MicOff className="h-3.5 w-3.5" />
        : <Mic className="h-3.5 w-3.5" />}
      {connected ? (conversation.isSpeaking ? "Agent speaking…" : "End call") : "Talk to Coordinator"}
    </Button>
  );
}