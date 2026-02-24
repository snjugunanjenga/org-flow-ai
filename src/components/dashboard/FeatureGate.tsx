import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface FeatureGateProps {
  feature: "members" | "projects" | "aiQueries" | "notebooks";
  currentCount?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, currentCount = 0, children, fallback }: FeatureGateProps) {
  const { orgId } = useOrg();
  const { subscription, loading } = useSubscription(orgId);

  if (loading || !subscription) return <>{children}</>;

  const limit = subscription.limits[feature];
  const isAtLimit = limit !== Infinity && currentCount >= limit;

  if (isAtLimit) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="glass-panel p-6 text-center space-y-3">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <h3 className="text-sm font-semibold">Plan Limit Reached</h3>
        <p className="text-xs text-muted-foreground">
          Your <Badge variant="outline">{subscription.plan}</Badge> plan allows{" "}
          {limit} {feature}. Upgrade to unlock more.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
