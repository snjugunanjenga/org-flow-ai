import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";
import { AdminGuard } from "@/components/auth/AdminGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import ResourcesView from "./pages/dashboard/ResourcesView";
import AcceptInvite from "./pages/AcceptInvite";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import GraphView from "./pages/dashboard/GraphView";
import AgentsView from "./pages/dashboard/AgentsView";
import MessagesView from "./pages/dashboard/MessagesView";
import TopicsView from "./pages/dashboard/TopicsView";
import TeamsView from "./pages/dashboard/TeamsView";
import ProjectsView from "./pages/dashboard/ProjectsView";
import OversightView from "./pages/dashboard/OversightView";
import NotificationsView from "./pages/dashboard/NotificationsView";
import AnalyticsView from "./pages/dashboard/AnalyticsView";
import SettingsView from "./pages/dashboard/SettingsView";
import CalendarView from "./pages/dashboard/CalendarView";
import DirectMessagesView from "./pages/dashboard/DirectMessagesView";
import AdminView from "./pages/dashboard/AdminView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="graph" element={<GraphView />} />
                <Route path="agents" element={<AgentsView />} />
                <Route path="messages" element={<MessagesView />} />
                <Route path="topics" element={<TopicsView />} />
                <Route path="teams" element={<TeamsView />} />
                <Route path="projects" element={<ProjectsView />} />
                <Route path="oversight" element={<OversightView />} />
                <Route path="notifications" element={<NotificationsView />} />
                <Route path="analytics" element={<AnalyticsView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="dm" element={<DirectMessagesView />} />
                <Route path="resources" element={<ResourcesView />} />
                <Route path="admin" element={<AdminGuard><AdminView /></AdminGuard>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
