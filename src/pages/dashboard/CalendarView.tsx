import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, Video, Clock, Trash2, Pencil } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meet_link: string | null;
  event_type: string;
  attendees: string[];
  created_by: string;
}

export default function CalendarView() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", start_time: "", end_time: "",
    location: "", meet_link: "", event_type: "meeting", attendees: "",
  });

  const loadEvents = async () => {
    if (!orgId) return;
    const { data } = await supabase.from("calendar_events").select("*").eq("org_id", orgId).order("start_time");
    setEvents((data as CalendarEvent[]) || []);
  };

  useEffect(() => { loadEvents(); }, [orgId]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = startOfMonth(currentMonth).getDay();

  const getEventsForDay = (date: Date) => events.filter(e => isSameDay(new Date(e.start_time), date));

  const generateMeetLink = () => {
    const code = Math.random().toString(36).substring(2, 12);
    setForm(f => ({ ...f, meet_link: `https://meet.google.com/${code.slice(0,3)}-${code.slice(3,7)}-${code.slice(7)}` }));
  };

  const handleCreate = async () => {
    if (!orgId || !user || !form.title.trim() || !form.start_time || !form.end_time) return;
    const { error } = await supabase.from("calendar_events").insert({
      org_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      location: form.location.trim() || null,
      meet_link: form.meet_link.trim() || null,
      event_type: form.event_type,
      created_by: user.id,
      attendees: form.attendees.split(",").map(s => s.trim()).filter(Boolean),
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Event created" });
    setShowCreate(false);
    resetForm();
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("calendar_events").delete().eq("id", id);
    toast({ title: "Event deleted" });
    setSelectedEvent(null);
    loadEvents();
  };

  const resetForm = () => setForm({ title: "", description: "", start_time: "", end_time: "", location: "", meet_link: "", event_type: "meeting", attendees: "" });

  const openCreateForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setForm({ ...form, start_time: `${dateStr}T09:00`, end_time: `${dateStr}T10:00` });
    setShowCreate(true);
  };

  const dayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule meetings, plan tasks, and create Google Meet links.</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}><Plus className="h-4 w-4 mr-1" /> New Event</Button>
      </div>

      {/* Calendar grid */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-sm text-muted-foreground hover:text-foreground">← Prev</button>
          <h3 className="text-lg font-semibold font-display">{format(currentMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-sm text-muted-foreground hover:text-foreground">Next →</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
          ))}
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const dayEvts = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => openCreateForDate(day)}
                className={`p-2 min-h-[72px] text-left rounded-lg border transition-all text-xs ${
                  isSelected ? "border-primary bg-primary/10" : isToday ? "border-accent/50 bg-accent/5" : "border-border/30 hover:bg-muted/30"
                }`}
              >
                <span className={`font-medium ${isToday ? "text-accent" : ""}`}>{format(day, "d")}</span>
                {dayEvts.slice(0, 2).map(e => (
                  <div key={e.id} className="mt-0.5 px-1 py-0.5 rounded bg-primary/10 text-primary truncate text-[10px]" onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}>
                    {e.meet_link && <Video className="h-2.5 w-2.5 inline mr-0.5" />}
                    {e.title}
                  </div>
                ))}
                {dayEvts.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayEvts.length - 2} more</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day events sidebar */}
      {selectedDate && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold font-display">{format(selectedDate, "EEEE, MMMM d")}</h3>
            <Button size="sm" variant="outline" onClick={() => openCreateForDate(selectedDate)}><Plus className="h-3 w-3 mr-1" /> Add</Button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {dayEvents.map(e => (
                <button key={e.id} onClick={() => setSelectedEvent(e)} className="w-full text-left p-3 rounded-lg bg-muted/30 hover:ring-1 hover:ring-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{e.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(e.start_time), "h:mm a")} - {format(new Date(e.end_time), "h:mm a")}
                    </div>
                  </div>
                  {e.meet_link && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                      <Video className="h-3 w-3" /> Google Meet
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {events.filter(e => new Date(e.start_time) >= new Date()).slice(0, 10).map(e => (
            <button key={e.id} onClick={() => setSelectedEvent(e)} className="w-full text-left flex items-center gap-3 py-2 border-b border-border/30 last:border-0 hover:bg-muted/20 rounded px-2 transition-colors">
              <div className="w-12 text-center shrink-0">
                <p className="text-xs text-muted-foreground">{format(new Date(e.start_time), "MMM")}</p>
                <p className="text-lg font-bold">{format(new Date(e.start_time), "d")}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(e.start_time), "h:mm a")} - {format(new Date(e.end_time), "h:mm a")}</p>
              </div>
              {e.meet_link && <Video className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
        </div>
      </div>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedEvent?.title}</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.description && <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Start:</span> <span className="ml-1">{format(new Date(selectedEvent.start_time), "PPp")}</span></div>
                <div><span className="text-muted-foreground">End:</span> <span className="ml-1">{format(new Date(selectedEvent.end_time), "PPp")}</span></div>
                {selectedEvent.location && <div className="col-span-2"><span className="text-muted-foreground">Location:</span> <span className="ml-1">{selectedEvent.location}</span></div>}
                {selectedEvent.attendees.length > 0 && <div className="col-span-2"><span className="text-muted-foreground">Attendees:</span> <span className="ml-1">{selectedEvent.attendees.join(", ")}</span></div>}
              </div>
              {selectedEvent.meet_link && (
                <a href={selectedEvent.meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Video className="h-5 w-5" />
                  <span className="text-sm font-medium">Join Google Meet</span>
                </a>
              )}
              {selectedEvent.created_by === user?.id && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedEvent.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete Event</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create event dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Google Meet Link</label>
                <Button variant="ghost" size="sm" onClick={generateMeetLink} className="text-xs"><Video className="h-3 w-3 mr-1" /> Generate Link</Button>
              </div>
              <Input value={form.meet_link} onChange={e => setForm({ ...form, meet_link: e.target.value })} placeholder="https://meet.google.com/..." className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attendees (comma-separated)</label>
              <Input value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} placeholder="john@company.com, jane@company.com" className="bg-secondary/50" />
            </div>
            <Button className="w-full" onClick={handleCreate}>Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
