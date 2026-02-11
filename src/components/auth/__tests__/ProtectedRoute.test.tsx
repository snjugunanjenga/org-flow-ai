import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockMaybeSingle = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  },
}));

const renderWithRoute = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while checking auth", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderWithRoute();
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
  });

  it("redirects to /auth when no user", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Auth Page")).toBeInTheDocument();
    });
  });

  it("redirects to /onboarding when onboarding_completed is false", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false });
    mockMaybeSingle.mockResolvedValue({ data: { onboarding_completed: false } });
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
    });
  });

  it("renders children when authenticated and onboarded", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false });
    mockMaybeSingle.mockResolvedValue({ data: { onboarding_completed: true } });
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });
  });
});
