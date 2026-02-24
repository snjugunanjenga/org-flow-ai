import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionData {
  plan: string;
  status: string;
  isTrialing: boolean;
  trialDaysLeft: number;
  limits: {
    members: number;
    projects: number;
    aiQueries: number;
    notebooks: number;
  };
}

const PLAN_LIMITS: Record<string, SubscriptionData["limits"]> = {
  free: { members: 5, projects: 1, aiQueries: 10, notebooks: 2 },
  pro: { members: Infinity, projects: Infinity, aiQueries: Infinity, notebooks: Infinity },
  enterprise: { members: Infinity, projects: Infinity, aiQueries: Infinity, notebooks: Infinity },
};

export function useSubscription(orgId: string | null) {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }

    supabase
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle()
      .then(({ data: sub }) => {
        if (sub) {
          const trialEnd = new Date(sub.trial_ends_at);
          const now = new Date();
          const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));

          setData({
            plan: sub.plan,
            status: sub.status,
            isTrialing: sub.status === "trialing",
            trialDaysLeft: daysLeft,
            limits: PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free,
          });
        } else {
          setData({
            plan: "free",
            status: "none",
            isTrialing: false,
            trialDaysLeft: 0,
            limits: PLAN_LIMITS.free,
          });
        }
        setLoading(false);
      });
  }, [orgId]);

  return { subscription: data, loading };
}
