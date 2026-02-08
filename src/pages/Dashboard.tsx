import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-semibold gradient-text">
              AI Chief of Staff
            </h1>
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
