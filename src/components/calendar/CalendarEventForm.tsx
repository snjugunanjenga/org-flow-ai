import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CalendarEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
  googleConnected: boolean;
  onCreated: () => void;
  createMeetEvent: (params: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    attendees?: string[];
    org_id: string;
  }) => Promise<{ meet_link?: string } | null>;
  selectedDate: Date | null;
}

export function CalendarEventForm({
  open, onOpenChange, orgId, googleConnected, onCreated, createMeetEvent, selectedDate,
}: CalendarEventFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [addMeet, setAddMeet] = useState(false);

  const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const [form, setForm] = useState({
    title: "", description: "",
    start_time: defaultDate ? `${defaultDate}T09:00` : "",
    end_time: defaultDate ? `${defaultDate}T10:00` : "",
    location: "", attendees: "",
  });

  const resetForm = () => {
    setForm({ title: "", description: "", start_time: "", end_time: "", location: "", attendees: "" });
    setAddMeet(false);
  };

  const handleCreate = async () => {
    if (!orgId || !user || !form.title.trim() || !form.start_time || !form.end_time) return;
    setCreating(true);

    const attendeesList = form.attendees.split(",").map(s => s.trim()).filter(Boolean);

    try {
      // If Google connected and Meet requested, create via Google API
      if (googleConnected && addMeet) {
        const result = await createMeetEvent({
          title: form.title.trim(),
          description: form.description.trim(),
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          attendees: attendeesList,
          org_id: orgId,
        });
        if (result) {
          onOpenChange(false);
          resetForm();
          onCreated();
        }
      } else {
        // Create locally only
        const { error } = await supabase.from("calendar_events").insert({
          org_id: orgId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          location: form.location.trim() || null,
          meet_link: null,
          event_type: "meeting",
          created_by: user.id,
          attendees: attendeesList,
        });
        if (error) {
          toast({ variant: "destructive", title: "Error", description: error.message });
        } else {
          toast({ title: "Event created" });
          onOpenChange(false);
          resetForm();
          onCreated();
        }
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Meeting title" className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="bg-secondary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start</label>
              <Input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End</label>
              <Input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="bg-secondary/50" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room or virtual" className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Attendees (comma-separated emails)</label>
            <Input value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} placeholder="john@company.com, jane@company.com" className="bg-secondary/50" />
          </div>

          {/* Google Meet toggle */}
          {googleConnected && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <Label htmlFor="add-meet" className="text-sm font-medium">Add Google Meet</Label>
              </div>
              <Switch id="add-meet" checked={addMeet} onCheckedChange={setAddMeet} />
            </div>
          )}
          {!googleConnected && (
            <p className="text-xs text-muted-foreground">Connect Google Calendar to create events with Google Meet links.</p>
          )}

          <Button className="w-full" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : addMeet ? "Create with Google Meet" : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
