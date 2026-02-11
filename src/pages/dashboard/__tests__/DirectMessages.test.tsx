import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DirectMessagesView from "../DirectMessagesView";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "direct_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: "dm1", sender_id: "user1", recipient_id: "user2", content: "Hello!", is_team_message: false, read: false, created_at: "2026-01-15T10:00:00Z", team_id: null },
                  { id: "dm2", sender_id: "user2", recipient_id: "user1", content: "Hi there!", is_team_message: false, read: true, created_at: "2026-01-15T10:01:00Z", team_id: null },
                ],
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) }),
        };
      }
      if (table === "org_memberships") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ user_id: "user1" }, { user_id: "user2" }],
            }),
          }),
        };
      }
      if (table === "teams") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: "team1", name: "Engineering", color: "#6366f1" }],
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { user_id: "user1", display_name: "Alice" },
                { user_id: "user2", display_name: "Bob" },
              ],
            }),
          }),
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [] }) };
    },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user1", email: "alice@test.com" } }),
}));

vi.mock("@/hooks/use-org-id", () => ({
  useOrgId: () => "org1",
}));

const renderDM = () =>
  render(
    <BrowserRouter>
      <DirectMessagesView />
    </BrowserRouter>
  );

describe("DirectMessagesView", () => {
  it("renders page title", () => {
    renderDM();
    expect(screen.getByText("Direct Messages")).toBeInTheDocument();
  });

  it("shows empty state when no channel selected", () => {
    renderDM();
    expect(screen.getByText("Select a person or team to start messaging.")).toBeInTheDocument();
  });

  it("shows member names in channel list", async () => {
    renderDM();
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows team names in channel list", async () => {
    renderDM();
    await waitFor(() => {
      expect(screen.getByText("Engineering")).toBeInTheDocument();
    });
  });

  it("renders message input when channel is selected", async () => {
    renderDM();
    await waitFor(() => {
      fireEvent.click(screen.getByText("Bob"));
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Message Bob...")).toBeInTheDocument();
    });
  });
});
