import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Onboarding from "@/pages/Onboarding";

// Mock auth
const mockUser = { id: "user-123", email: "test@test.com" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Must use vi.hoisted for variables referenced in vi.mock factories
const { mockTeamInsert, mockInsert, mockFunctionsInvoke, mockToast } = vi.hoisted(() => ({
  mockTeamInsert: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
  mockInsert: vi.fn().mockReturnValue({
    select: () => ({
      single: () =>
        Promise.resolve({
          data: { id: "org-1", name: "Test Org", slug: "test-org" },
          error: null,
        }),
    }),
  }),
  mockFunctionsInvoke: vi.fn().mockResolvedValue({
    data: { invite_link: "https://example.com/invite?token=abc" },
    error: null,
  }),
  mockToast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "organizations") return { insert: mockInsert };
      if (table === "org_memberships")
        return { insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })) };
      if (table === "user_roles")
        return { insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })) };
      if (table === "teams") return { insert: mockTeamInsert };
      if (table === "profiles")
        return { update: () => ({ eq: () => Promise.resolve({ error: null }) }) };
      return { insert: vi.fn(), select: vi.fn(), update: vi.fn() };
    },
    functions: { invoke: mockFunctionsInvoke },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const renderOnboarding = () =>
  render(
    <MemoryRouter>
      <Onboarding />
    </MemoryRouter>
  );

describe("Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // === Step 0: Create Organization ===

  it("renders step 0 (Create Organization) by default", () => {
    renderOnboarding();
    expect(screen.getByText("Create your organization")).toBeInTheDocument();
  });

  it("disables Create Organization button when org name is empty", () => {
    renderOnboarding();
    const btn = screen.getByRole("button", { name: /Create Organization/i });
    expect(btn).toBeDisabled();
  });

  it("enables button when org name is entered", () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    const btn = screen.getByRole("button", { name: /Create Organization/i });
    expect(btn).not.toBeDisabled();
  });

  it("shows slug preview when org name is typed", () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "My Org Name" },
    });
    expect(screen.getByText(/Slug: my-org-name/)).toBeInTheDocument();
  });

  it("advances to step 1 after org creation", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Set up your teams")).toBeInTheDocument();
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test Org", slug: "test-org", created_by: "user-123" })
    );
  });

  // === Step 1: Set Up Teams ===

  it("renders suggested team chips on step 1", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Set up your teams")).toBeInTheDocument();
    });

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("can remove a team chip", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Engineering")).toBeInTheDocument();
    });

    // Remove "HR" team by clicking its X button
    const hrChip = screen.getByText("HR").closest("span")!;
    const removeBtn = hrChip.querySelector("button")!;
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText("HR")).not.toBeInTheDocument();
    });
  });

  it("can add a custom team", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Set up your teams")).toBeInTheDocument();
    });

    const teamInput = screen.getByPlaceholderText("Add a team...");
    fireEvent.change(teamInput, { target: { value: "Finance" } });
    fireEvent.keyDown(teamInput, { key: "Enter" });

    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("advances to step 2 after creating teams", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Set up your teams")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Teams/i }));

    await waitFor(() => {
      expect(screen.getByText("Invite your team")).toBeInTheDocument();
    });

    // Should have called teams insert for each team
    expect(mockTeamInsert).toHaveBeenCalled();
  });

  // === Step 2: Invite Members ===

  it("can add invite entries with email and role", async () => {
    renderOnboarding();
    // Navigate to step 2
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => screen.getByText("Set up your teams"));
    fireEvent.click(screen.getByRole("button", { name: /Create Teams/i }));
    await waitFor(() => screen.getByText("Invite your team"));

    // Add an invite
    const emailInput = screen.getByPlaceholderText("colleague@company.com");
    fireEvent.change(emailInput, { target: { value: "bob@company.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });

    expect(screen.getByText("bob@company.com")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("shows Skip & Go to Dashboard when no invites added", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => screen.getByText("Set up your teams"));
    fireEvent.click(screen.getByRole("button", { name: /Create Teams/i }));
    await waitFor(() => screen.getByText("Invite your team"));

    expect(
      screen.getByRole("button", { name: /Skip & Go to Dashboard/i })
    ).toBeInTheDocument();
  });

  it("prevents duplicate invite emails", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => screen.getByText("Set up your teams"));
    fireEvent.click(screen.getByRole("button", { name: /Create Teams/i }));
    await waitFor(() => screen.getByText("Invite your team"));

    const emailInput = screen.getByPlaceholderText("colleague@company.com");
    fireEvent.change(emailInput, { target: { value: "bob@company.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });

    // Try adding same email again
    fireEvent.change(emailInput, { target: { value: "bob@company.com" } });
    fireEvent.keyDown(emailInput, { key: "Enter" });

    // Should show toast about duplicate
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive", title: "Already added" })
    );
  });

  it("navigates to dashboard on completion", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), {
      target: { value: "Test Org" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => screen.getByText("Set up your teams"));
    fireEvent.click(screen.getByRole("button", { name: /Create Teams/i }));
    await waitFor(() => screen.getByText("Invite your team"));

    fireEvent.click(screen.getByRole("button", { name: /Skip & Go to Dashboard/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
