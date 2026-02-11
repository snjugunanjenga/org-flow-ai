import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ResourcesView from "../ResourcesView";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "resource_notebooks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: "nb1", title: "Research Notebook", description: "AI research", project_id: null, created_at: "2026-01-01T00:00:00Z" },
                  { id: "nb2", title: "Meeting Prep", description: null, project_id: null, created_at: "2026-01-02T00:00:00Z" },
                ],
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "nb3", title: "New Notebook", description: null, project_id: null, created_at: "2026-02-11T00:00:00Z" },
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [] }) };
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user1", email: "alice@test.com" } }),
}));

vi.mock("@/hooks/use-org-id", () => ({
  useOrgId: () => "org1",
}));

const renderResources = () =>
  render(
    <BrowserRouter>
      <ResourcesView />
    </BrowserRouter>
  );

describe("ResourcesView", () => {
  it("renders page title", () => {
    renderResources();
    expect(screen.getByText("Resources")).toBeInTheDocument();
  });

  it("shows notebook list", async () => {
    renderResources();
    await waitFor(() => {
      expect(screen.getByText("Research Notebook")).toBeInTheDocument();
      expect(screen.getByText("Meeting Prep")).toBeInTheDocument();
    });
  });

  it("has create notebook input", () => {
    renderResources();
    expect(screen.getByPlaceholderText("New notebook title...")).toBeInTheDocument();
  });

  it("has create button", () => {
    renderResources();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("disables create button when input is empty", () => {
    renderResources();
    const createBtn = screen.getByText("Create");
    expect(createBtn).toBeDisabled();
  });

  it("enables create button when input has text", async () => {
    renderResources();
    const input = screen.getByPlaceholderText("New notebook title...");
    fireEvent.change(input, { target: { value: "My Notebook" } });
    const createBtn = screen.getByText("Create");
    expect(createBtn).not.toBeDisabled();
  });
});
