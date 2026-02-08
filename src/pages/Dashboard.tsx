import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DEMO_EMAILS = [
  "steve.jobs@apple.com",
  "sarah.chen@apple.com",
  "marcus.johnson@apple.com",
  "emily.rodriguez@apple.com",
  "david.kim@apple.com",
  "lisa.wang@apple.com",
  "james.taylor@apple.com",
  "priya.patel@apple.com",
  "alex.martinez@apple.com",
  "rachel.green@apple.com",
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);
  const isDemo = user?.email ? DEMO_EMAILS.includes(user.email) : false;

  useEffect(() => {
    if (!user) return;
    const fetchOrg = async () => {
      const { data: membership } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.org_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", membership.org_id)
          .maybeSingle();
        setOrgName(org?.name || null);
      }
    };
    fetchOrg();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-semibold gradient-text">
              AI Chief of Staff
            </h1>
            {orgName && (
              <span className="text-sm text-muted-foreground ml-2">— {orgName}</span>
            )}
            {isDemo && (
              <Badge variant="outline" className="ml-2 border-accent text-accent text-xs">
                <FlaskConical className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="glass-panel p-12 text-center">
          <h2 className="text-3xl font-bold font-display mb-4">Welcome to your Command Center</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your dashboard is being built. The knowledge graph, agent system, and integrations will appear here.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
