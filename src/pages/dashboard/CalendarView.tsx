import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { CalendarDays, Plus, Video, Clock, Trash2, RefreshCw, LogIn, LogOut, FolderKanban, AlertTriangle, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface ProjectItem {
  id: string;
  title: string;
  date: string;
  itemType: "project_deadline" | "task_due" | "topic";
  color: string;
}

export default function CalendarView() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const google = useGoogleCalendar();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showProjectItems, setShowProjectItems] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase.from("calendar_events").select("*").eq("org_id", orgId).order("start_time");
    setEvents((data as CalendarEvent[]) || []);
  }, [orgId]);

  const loadProjectItems = useCallback(async () => {
    if (!orgId) return;
    const items: ProjectItem[] = [];

    // Projects with target dates
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, target_date, start_date")
      .eq("org_id", orgId)
      .not("target_date", "is", null);
    projects?.forEach((p) => {
      if (p.target_date) {
        items.push({ id: `proj-${p.id}`, title: `📁 ${p.name} (deadline)`, date: p.target_date, itemType: "project_deadline", color: "hsl(280, 70%, 65%)" });
      }
    });

    // Tasks with due dates
    const { data: tasks } = await supabase
      .from("project_tasks")
      .select("id, title, due_date, status")
      .eq("org_id", orgId)
      .not("due_date", "is", null);
    tasks?.forEach((t: any) => {
      if (t.due_date) {
        items.push({ id: `task-${t.id}`, title: `✅ ${t.title}`, date: t.due_date, itemType: "task_due", color: "hsl(170, 70%, 50%)" });
      }
    });

    // Topics with recent updates (show on their updated_at date)
    const { data: topics } = await supabase
      .from("topics")
      .select("id, title, updated_at, category")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(20);
    topics?.forEach((t) => {
      items.push({ id: `topic-${t.id}`, title: `💡 ${t.title}`, date: t.updated_at.split("T")[0], itemType: "topic", color: "hsl(40, 90%, 60%)" });
    });

    setProjectItems(items);
  }, [orgId]);

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

  useEffect(() => { loadEvents(); loadProjectItems(); }, [loadEvents, loadProjectItems]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = startOfMonth(currentMonth).getDay();

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const calEvents = events.filter(e => isSameDay(new Date(e.start_time), date));
    if (!showProjectItems) return calEvents;
    // Merge project items as pseudo-events
    const dateStr = format(date, "yyyy-MM-dd");
    const pItems = projectItems.filter(p => p.date === dateStr);
    const pseudoEvents: CalendarEvent[] = pItems.map(p => ({
      id: p.id,
      title: p.title,
      description: null,
      start_time: `${p.date}T00:00:00`,
      end_time: `${p.date}T23:59:59`,
      location: null,
      meet_link: null,
      event_type: p.itemType,
      attendees: [],
      created_by: "",
    }));
    return [...calEvents, ...pseudoEvents];
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display">Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule meetings, track deadlines, and sync with Google Calendar.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={showProjectItems ? "default" : "outline"}
            onClick={() => setShowProjectItems(!showProjectItems)}
          >
            <FolderKanban className="h-4 w-4 mr-1" />
            {showProjectItems ? "Hide" : "Show"} Projects
          </Button>
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

      {/* Legend */}
      {showProjectItems && (
        <div className="flex gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-primary" /><span className="text-muted-foreground">Meeting</span></div>
          <div className="flex items-center gap-1.5"><FolderKanban className="h-3 w-3" style={{ color: "hsl(280, 70%, 65%)" }} /><span className="text-muted-foreground">Project Deadline</span></div>
          <div className="flex items-center gap-1.5"><CheckSquare className="h-3 w-3" style={{ color: "hsl(170, 70%, 50%)" }} /><span className="text-muted-foreground">Task Due</span></div>
          <div className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" style={{ color: "hsl(40, 90%, 60%)" }} /><span className="text-muted-foreground">Topic</span></div>
        </div>
      )}

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
        onSelectEvent={(e) => {
          if (!e.id.startsWith("proj-") && !e.id.startsWith("task-") && !e.id.startsWith("topic-")) {
            setSelectedEvent(e);
          }
        }}
        onCreateForDate={() => setShowCreate(true)}
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
              {dayEvents.map(e => {
                const isPseudo = e.id.startsWith("proj-") || e.id.startsWith("task-") || e.id.startsWith("topic-");
                return (
                  <button
                    key={e.id}
                    onClick={() => !isPseudo && setSelectedEvent(e)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${isPseudo ? "bg-muted/20 cursor-default" : "bg-muted/30 hover:ring-1 hover:ring-primary/30 cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{e.title}</h4>
                      {!isPseudo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(e.start_time), "h:mm a")} - {format(new Date(e.end_time), "h:mm a")}
                        </div>
                      )}
                    </div>
                    {e.meet_link && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <Video className="h-3 w-3" /> Google Meet
                      </div>
                    )}
                  </button>
                );
              })}
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
