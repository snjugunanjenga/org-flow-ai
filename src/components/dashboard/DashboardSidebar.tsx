import { 
  LayoutDashboard, Users, FolderKanban, MessageSquare, 
  Network, Brain, AlertTriangle, Bell, Settings, 
  BarChart3, Eye, LogOut, FlaskConical, CalendarDays, MessageCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const DEMO_EMAILS = [
  "steve.jobs@apple.com", "sarah.chen@apple.com", "marcus.johnson@apple.com",
  "emily.rodriguez@apple.com", "david.kim@apple.com", "lisa.wang@apple.com",
  "james.taylor@apple.com", "priya.patel@apple.com", "alex.martinez@apple.com",
  "rachel.green@apple.com",
];

const mainNav = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Knowledge Graph", url: "/dashboard/graph", icon: Network },
  { title: "AI Agents", url: "/dashboard/agents", icon: Brain },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Topics & Decisions", url: "/dashboard/topics", icon: AlertTriangle },
];

const orgNav = [
  { title: "Teams", url: "/dashboard/teams", icon: Users },
  { title: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Direct Messages", url: "/dashboard/dm", icon: MessageCircle },
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "Oversight", url: "/dashboard/oversight", icon: Eye },
];

const systemNav = [
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const isDemo = user?.email ? DEMO_EMAILS.includes(user.email) : false;

  const linkClass = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";
  const activeClass = "bg-primary/10 text-primary font-medium";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
      <div className="px-4 py-5 flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="text-base font-display font-semibold gradient-text truncate">
            AI Chief of Staff
          </span>
        )}
      </div>

      {isDemo && !collapsed && (
        <div className="px-4 pb-2">
          <Badge variant="outline" className="border-accent text-accent text-xs w-full justify-center">
            <FlaskConical className="h-3 w-3 mr-1" />Demo Mode
          </Badge>
        </div>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orgNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-3 border-t border-border/50">
          {!collapsed && (
            <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
