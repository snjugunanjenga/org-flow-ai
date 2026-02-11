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

// Mock supabase
const mockInsert = vi.fn().mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { id: "org-1", name: "Test Org", slug: "test-org" }, error: null }) }) });
const mockUpdate = vi.fn().mockReturnValue(Promise.resolve({ error: null }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "organizations") return { insert: mockInsert };
      if (table === "org_memberships") return { insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })) };
      if (table === "user_roles") return { insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })) };
      if (table === "teams") return { insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })) };
      if (table === "profiles") return { update: () => ({ eq: () => Promise.resolve({ error: null }) }) };
      return { insert: vi.fn(), select: vi.fn(), update: vi.fn() };
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: { invite_link: "https://example.com/invite" }, error: null }) },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
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
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), { target: { value: "Test Org" } });
    const btn = screen.getByRole("button", { name: /Create Organization/i });
    expect(btn).not.toBeDisabled();
  });

  it("shows slug preview when org name is typed", () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Corp"), { target: { value: "My Org Name" } });
    expect(screen.getByText(/Slug: my-org-name/)).toBeInTheDocument();
  });
});
