import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList } from "lucide-react";

interface AuditEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface AdminAuditLogTabProps {
  entries: AuditEntry[];
}

const actionLabels: Record<string, { label: string; color: string }> = {
  subscription_updated: { label: "Subscription Updated", color: "bg-primary/10 text-primary border-primary/30" },
  newsletter_sent: { label: "Newsletter Sent", color: "bg-accent/10 text-accent border-accent/30" },
  org_suspended: { label: "Org Suspended", color: "bg-destructive/10 text-destructive border-destructive/30" },
  org_reviewed: { label: "Org Reviewed", color: "bg-muted text-muted-foreground border-border" },
};

export function AdminAuditLogTab({ entries }: AdminAuditLogTabProps) {
  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No audit entries yet</h3>
        <p className="text-muted-foreground text-sm">
          Admin actions will be logged here automatically.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2">
        {entries.map((entry) => {
          const actionInfo = actionLabels[entry.action] || {
            label: entry.action,
            color: "bg-muted text-muted-foreground",
          };

          return (
            <div key={entry.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className={actionInfo.color}>
                  {actionInfo.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {entry.metadata &&
                  Object.entries(entry.metadata).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-foreground/70 capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>{" "}
                      {String(value)}
                    </p>
                  ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Target: {entry.target_type}
              </p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
