import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard } from "lucide-react";

interface Subscription {
  id: string;
  org_id: string;
  plan: string;
  status: string;
  trial_ends_at: string;
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
  org_name?: string;
}

interface AdminSubscriptionsTabProps {
  subscriptions: Subscription[];
  onUpdate: (id: string, plan: string, status: string) => void;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    trialing: "bg-accent/10 text-accent border-accent/30",
    active: "bg-primary/10 text-primary border-primary/30",
    canceled: "bg-muted text-muted-foreground border-border",
    past_due: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={colors[status] || ""}>
      {status}
    </Badge>
  );
};

const planBadge = (plan: string) => {
  const colors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-accent/10 text-accent",
  };
  return (
    <Badge variant="outline" className={colors[plan] || ""}>
      {plan}
    </Badge>
  );
};

export function AdminSubscriptionsTab({ subscriptions, onUpdate }: AdminSubscriptionsTabProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
        <p className="text-muted-foreground text-sm">
          Subscriptions will appear here when organizations sign up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <div key={sub.id} className="glass-panel p-4 flex items-center gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{sub.org_name}</p>
            <p className="text-xs text-muted-foreground">
              Created {new Date(sub.created_at).toLocaleDateString()} ·
              Trial ends {new Date(sub.trial_ends_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {planBadge(sub.plan)}
            {statusBadge(sub.status)}
          </div>
          <div className="flex items-center gap-2">
            <Select
              defaultValue={sub.plan}
              onValueChange={(v) => onUpdate(sub.id, v, sub.status)}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select
              defaultValue={sub.status}
              onValueChange={(v) => onUpdate(sub.id, sub.plan, v)}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}
