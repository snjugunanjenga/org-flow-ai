import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminGuard } from "@/components/auth/AdminGuard";

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
          eq: () => ({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
    }),
  },
}));

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/admin"]}>
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard Home</div>} />
        <Route
          path="/dashboard/admin"
          element={
            <AdminGuard>
              <div>Super Admin Panel</div>
            </AdminGuard>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("AdminGuard (Super Admin protected route)", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockMaybeSingle.mockReset();
  });

  it("shows loading spinner while resolving auth/role", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderGuard();
    expect(screen.queryByText("Super Admin Panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard Home")).not.toBeInTheDocument();
  });

  it("never renders the admin panel when user is not authenticated", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockMaybeSingle.mockResolvedValue({ data: null });
    renderGuard();
    // Without a user the role lookup never resolves, so the panel must stay hidden.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Super Admin Panel")).not.toBeInTheDocument();
  });

  it("redirects to /dashboard when user lacks admin role", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    mockMaybeSingle.mockResolvedValue({ data: null });
    renderGuard();
    await waitFor(() => {
      expect(screen.getByText("Dashboard Home")).toBeInTheDocument();
    });
    expect(screen.queryByText("Super Admin Panel")).not.toBeInTheDocument();
  });

  it("renders children when user has admin role", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "admin-1" }, loading: false });
    mockMaybeSingle.mockResolvedValue({ data: { role: "admin" } });
    renderGuard();
    await waitFor(() => {
      expect(screen.getByText("Super Admin Panel")).toBeInTheDocument();
    });
  });
});