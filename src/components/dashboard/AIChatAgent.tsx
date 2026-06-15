import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, X, Brain, Loader2, Mic, MicOff, Power, PowerOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  trace?: Array<{ agent: string; action: string; output: string }>;
}

const STORAGE_KEY = "ai-cos-chat-enabled";

export function AIChatAgent() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === "true";
  });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) { setOpen(false); setIsListening(false); }
    toast({ title: next ? "AI Agent enabled" : "AI Agent disabled", description: next ? "The AI Chief of Staff is now active." : "You've opted out of the AI assistant." });
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ variant: "destructive", title: "Not supported", description: "Speech recognition is not supported in your browser." }); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(prev => prev + t); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !session) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: { messages: newMessages.map(m => ({ role: m.role, content: m.content })), agent: "coordinator" },
      });
      if (error) throw error;
      const assistantContent = data?.choices?.[0]?.message?.content || "I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent, trace: data?.trace ?? [] }]);
    } catch (err: any) {
      console.error("AI chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        onClick={toggleEnabled}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-muted text-muted-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        title="Enable AI Agent"
      >
        <PowerOff className="h-5 w-5" />
      </motion.button>
    );
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center animate-pulse-glow">
            <Brain className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold font-display">AI Chief of Staff</h4>
                  <p className="text-[10px] text-muted-foreground">Coordinator Agent</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleEnabled} className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted/50" title="Opt out of AI">
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50" title="Close chat">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="h-10 w-10 text-primary/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ask me anything about your organization.</p>
                  <div className="mt-4 space-y-2">
                    {["What are the open conflicts?", "Summarize this week's activity", "What's the status of Platform v2.0?"].map(q => (
                      <button key={q} onClick={() => setInput(q)} className="block w-full text-left text-xs p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/60 text-foreground rounded-bl-sm"}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.trace && msg.trace.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.trace.map((t, j) => (
                          <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded ${t.agent === "memory" ? "bg-[hsl(var(--agent-memory))]/15 text-[hsl(var(--agent-memory))]" : t.agent === "router" ? "bg-[hsl(var(--agent-router))]/15 text-[hsl(var(--agent-router))]" : t.agent === "critic" ? "bg-[hsl(var(--agent-critic))]/15 text-[hsl(var(--agent-critic))]" : "bg-[hsl(var(--agent-coordinator))]/15 text-[hsl(var(--agent-coordinator))]"}`}>{t.agent}·{t.action}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted/60 px-3 py-2 rounded-xl rounded-bl-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <button onClick={isListening ? stopListening : startListening} className={`p-2 rounded-lg transition-colors ${isListening ? "bg-destructive text-destructive-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`} title={isListening ? "Stop listening" : "Voice input"}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask your AI Chief of Staff..."
                  className="flex-1 text-sm bg-muted/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                />
                <button onClick={sendMessage} disabled={!input.trim() || loading} className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-opacity">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
