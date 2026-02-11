import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CalendarView from "../CalendarView";

// Mock Google calendar hook
vi.mock("@/hooks/use-google-calendar", () => ({
  useGoogleCalendar: () => ({
    connected: false,
    loading: false,
    syncing: false,
    checkConnection: vi.fn(),
    startOAuth: vi.fn(),
    exchangeCode: vi.fn(),
    syncEvents: vi.fn(),
    createMeetEvent: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const mockEvents = [
  {
    id: "evt1",
    title: "Team Standup",
    description: "Daily standup",
    start_time: "2026-02-11T09:00:00Z",
    end_time: "2026-02-11T09:30:00Z",
    location: null,
    meet_link: "https://meet.google.com/abc",
    event_type: "meeting",
    attendees: ["bob@test.com"],
    created_by: "user1",
  },
];

const mockProjects = [
  { id: "p1", name: "Alpha Project", target_date: "2026-02-15", start_date: "2026-01-01" },
];

const mockTasks = [
  { id: "t1", title: "Design review", due_date: "2026-02-12", status: "todo" },
];

const mockTopics = [
  { id: "top1", title: "API Strategy", updated_at: "2026-02-11T12:00:00Z", category: "decision" },
];

const makeChain = (): any => {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn();
  return chain;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {

      if (table === "calendar_events") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockEvents }) }) }), delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) };
      }
      if (table === "projects") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ not: vi.fn().mockResolvedValue({ data: mockProjects }) }) }) };
      }
      if (table === "project_tasks") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ not: vi.fn().mockResolvedValue({ data: mockTasks }) }) }) };
      }
      if (table === "topics") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: mockTopics }) }) }) }) };
      }
      return makeChain();
    },
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "test" } } }) },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user1", email: "alice@test.com" } }),
}));

vi.mock("@/hooks/use-org-id", () => ({
  useOrgId: () => "org1",
}));

const renderCalendar = () =>
  render(
    <BrowserRouter>
      <CalendarView />
    </BrowserRouter>
  );

describe("CalendarView", () => {
  it("renders calendar title", () => {
    renderCalendar();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("shows New Event button", () => {
    renderCalendar();
    expect(screen.getByText("New Event")).toBeInTheDocument();
  });

  it("shows Connect Google Calendar when not connected", () => {
    renderCalendar();
    expect(screen.getByText("Connect Google Calendar")).toBeInTheDocument();
  });

  it("shows project items toggle", () => {
    renderCalendar();
    expect(screen.getByText(/Projects/)).toBeInTheDocument();
  });

  it("renders month navigation", () => {
    renderCalendar();
    expect(screen.getByText("← Prev")).toBeInTheDocument();
    expect(screen.getByText("Next →")).toBeInTheDocument();
  });

  it("renders day headers", () => {
    renderCalendar();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("shows upcoming events section", () => {
    renderCalendar();
    expect(screen.getByText("Upcoming Events")).toBeInTheDocument();
  });

  it("shows legend when project items enabled", () => {
    renderCalendar();
    expect(screen.getByText("Project Deadline")).toBeInTheDocument();
    expect(screen.getByText("Task Due")).toBeInTheDocument();
    expect(screen.getByText("Topic")).toBeInTheDocument();
  });
});

describe("CalendarView - Google Meet integration", () => {
  it("renders Google Calendar connect button when not connected", () => {
    renderCalendar();
    expect(screen.getByText("Connect Google Calendar")).toBeInTheDocument();
  });

  it("does not show sync/disconnect when not connected", () => {
    renderCalendar();
    expect(screen.queryByText("Sync Google")).not.toBeInTheDocument();
    expect(screen.queryByText("Disconnect")).not.toBeInTheDocument();
  });
});

describe("CalendarView - Meeting creation", () => {
  it("opens create dialog when clicking New Event", async () => {
    renderCalendar();
    fireEvent.click(screen.getByText("New Event"));
    await waitFor(() => {
      expect(screen.getByText("New Event", { selector: "h2" }).closest("[role='dialog']") || screen.getByText("Title")).toBeTruthy();
    });
  });
});
