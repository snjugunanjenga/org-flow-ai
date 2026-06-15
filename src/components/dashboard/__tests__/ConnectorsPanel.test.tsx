import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectorsPanel } from "../ConnectorsPanel";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }),
    }),
    functions: { invoke: vi.fn() },
  },
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe("ConnectorsPanel", () => {
  beforeEach(() => vi.clearAllMocks());
  it("renders empty state and add controls", async () => {
    render(<ConnectorsPanel />);
    expect(await screen.findByText(/Connectors/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Channel ID/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add/i })).toBeInTheDocument();
  });
});