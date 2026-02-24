import { Building2, Users, TrendingUp, CreditCard } from "lucide-react";

interface AdminAnalyticsTabProps {
  analytics: {
    totalOrgs: number;
    totalUsers: number;
    freePlans: number;
    proPlans: number;
    enterprisePlans: number;
    trialingCount: number;
    activeCount: number;
  };
}

export function AdminAnalyticsTab({ analytics }: AdminAnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Organizations", value: analytics.totalOrgs, icon: Building2, color: "text-primary" },
          { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-accent" },
          { label: "Active Subs", value: analytics.activeCount, icon: TrendingUp, color: "text-primary" },
          { label: "Trialing", value: analytics.trialingCount, icon: CreditCard, color: "text-accent" },
        ].map((c) => (
          <div key={c.label} className="glass-panel p-5">
            <c.icon className={`h-5 w-5 ${c.color} mb-2`} />
            <p className="text-2xl font-bold font-display">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Free Plans", value: analytics.freePlans, color: "text-muted-foreground" },
          { label: "Pro Plans", value: analytics.proPlans, color: "text-primary" },
          { label: "Enterprise Plans", value: analytics.enterprisePlans, color: "text-accent" },
        ].map((c) => (
          <div key={c.label} className="glass-panel p-5 text-center">
            <p className={`text-3xl font-bold font-display ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
