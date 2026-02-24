import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";

interface Newsletter {
  id: string;
  subject: string;
  body: string;
  target_audience: string;
  sent_at: string;
  sent_count?: number;
  status?: string;
}

interface AdminNewslettersTabProps {
  newsletters: Newsletter[];
  onSend: (subject: string, body: string, audience: string) => Promise<void>;
  sending: boolean;
}

export function AdminNewslettersTab({ newsletters, onSend, sending }: AdminNewslettersTabProps) {
  const [nlSubject, setNlSubject] = useState("");
  const [nlBody, setNlBody] = useState("");
  const [nlAudience, setNlAudience] = useState("all");

  const handleSend = async () => {
    await onSend(nlSubject.trim(), nlBody.trim(), nlAudience);
    setNlSubject("");
    setNlBody("");
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold font-display">Compose Newsletter</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input
              value={nlSubject}
              onChange={(e) => setNlSubject(e.target.value)}
              placeholder="Newsletter subject..."
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-1">
            <Label>Body</Label>
            <Textarea
              value={nlBody}
              onChange={(e) => setNlBody(e.target.value)}
              placeholder="Write your newsletter content..."
              rows={8}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label>Target Audience</Label>
              <Select value={nlAudience} onValueChange={setNlAudience}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  <SelectItem value="free">Free Plan Only</SelectItem>
                  <SelectItem value="pro">Pro Plan Only</SelectItem>
                  <SelectItem value="enterprise">Enterprise Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !nlSubject.trim() || !nlBody.trim()}
              className="mt-auto"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Newsletter
            </Button>
          </div>
        </div>
      </div>

      {newsletters.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sent Newsletters
          </h3>
          {newsletters.map((nl) => (
            <div key={nl.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm">{nl.subject}</h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  {nl.sent_count != null && (
                    <Badge variant="outline" className="text-[10px]">
                      {nl.sent_count} sent
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {nl.target_audience}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {nl.body}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Sent {new Date(nl.sent_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
