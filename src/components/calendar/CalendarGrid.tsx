import { format, isSameDay } from "date-fns";
import { Video } from "lucide-react";

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

interface CalendarGridProps {
  currentMonth: Date;
  days: Date[];
  firstDayOffset: number;
  selectedDate: Date | null;
  getEventsForDay: (date: Date) => CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateForDate: (date: Date) => void;
}

export function CalendarGrid({
  currentMonth, days, firstDayOffset, selectedDate,
  getEventsForDay, onSelectDate, onPrevMonth, onNextMonth,
  onSelectEvent, onCreateForDate,
}: CalendarGridProps) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="text-sm text-muted-foreground hover:text-foreground">← Prev</button>
        <h3 className="text-lg font-semibold font-display">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={onNextMonth} className="text-sm text-muted-foreground hover:text-foreground">Next →</button>
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
              onClick={() => onSelectDate(day)}
              onDoubleClick={() => onCreateForDate(day)}
              className={`p-2 min-h-[72px] text-left rounded-lg border transition-all text-xs ${
                isSelected ? "border-primary bg-primary/10" : isToday ? "border-accent/50 bg-accent/5" : "border-border/30 hover:bg-muted/30"
              }`}
            >
              <span className={`font-medium ${isToday ? "text-accent" : ""}`}>{format(day, "d")}</span>
              {dayEvts.slice(0, 2).map(e => (
                <div key={e.id} className="mt-0.5 px-1 py-0.5 rounded bg-primary/10 text-primary truncate text-[10px]" onClick={(ev) => { ev.stopPropagation(); onSelectEvent(e as any); }}>
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
  );
}
