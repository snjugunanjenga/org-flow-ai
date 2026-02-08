import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { CalendarDays, Plus, Video, Clock, Trash2, RefreshCw, LogIn, LogOut } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarEventForm } from "@/components/calendar/CalendarEventForm";

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
  const google = useGoogleCalendar();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadEvents = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase.from("calendar_events").select("*").eq("org_id", orgId).order("start_time");
    setEvents((data as CalendarEvent[]) || []);
  }, [orgId]);

  // Check Google connection + handle OAuth callback
  useEffect(() => {
    google.checkConnection();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
      google.exchangeCode(code).then((success) => {
        if (success && orgId) {
          google.syncEvents(orgId).then(() => loadEvents());
        }
      });
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = startOfMonth(currentMonth).getDay();
  const getEventsForDay = (date: Date) => events.filter(e => isSameDay(new Date(e.start_time), date));

  const handleDelete = async (id: string) => {
    await supabase.from("calendar_events").delete().eq("id", id);
    toast({ title: "Event deleted" });
    setSelectedEvent(null);
    loadEvents();
  };

  const handleSync = async () => {
    if (!orgId) return;
    await google.syncEvents(orgId);
    loadEvents();
  };

  const dayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule meetings and sync with Google Calendar.</p>
        </div>
        <div className="flex items-center gap-2">
          {google.connected ? (
            <>
              <Button size="sm" variant="outline" onClick={handleSync} disabled={google.syncing}>
                <RefreshCw className={`h-4 w-4 mr-1 ${google.syncing ? "animate-spin" : ""}`} />
                {google.syncing ? "Syncing…" : "Sync Google"}
              </Button>
              <Button size="sm" variant="ghost" onClick={google.disconnect}>
                <LogOut className="h-4 w-4 mr-1" /> Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={google.startOAuth} disabled={google.loading}>
              <LogIn className="h-4 w-4 mr-1" /> Connect Google Calendar
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        currentMonth={currentMonth}
        days={days}
        firstDayOffset={firstDayOffset}
        selectedDate={selectedDate}
        getEventsForDay={getEventsForDay}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        onSelectEvent={setSelectedEvent}
        onCreateForDate={(date) => setShowCreate(true)}
      />

      {/* Day events sidebar */}
      {selectedDate && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold font-display">{format(selectedDate, "EEEE, MMMM d")}</h3>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
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
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedEvent.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete Event
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create event dialog */}
      <CalendarEventForm
        open={showCreate}
        onOpenChange={setShowCreate}
        orgId={orgId}
        googleConnected={google.connected}
        onCreated={loadEvents}
        createMeetEvent={google.createMeetEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
}
