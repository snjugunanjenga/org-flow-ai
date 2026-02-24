import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Users, Search, ChevronDown, ChevronUp } from "lucide-react";

interface OrgData {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  suspended_at: string | null;
  member_count: number;
  plan: string;
  status: string;
}

interface AdminOrganizationsTabProps {
  organizations: OrgData[];
}

export function AdminOrganizationsTab({ organizations }: AdminOrganizationsTabProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const planColor: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/10 text-primary",
    enterprise: "bg-accent/10 text-accent",
  };

  const statusColor: Record<string, string> = {
    trialing: "bg-accent/10 text-accent border-accent/30",
    active: "bg-primary/10 text-primary border-primary/30",
    canceled: "bg-muted text-muted-foreground border-border",
    past_due: "bg-destructive/10 text-destructive border-destructive/30",
  };

  if (organizations.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
        <p className="text-muted-foreground text-sm">
          Organizations will appear here when users sign up and create them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations..."
          className="pl-9 bg-secondary/50 border-border/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((org) => (
          <div key={org.id} className="glass-panel overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
              className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
            >
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{org.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{org.slug} · Created {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {org.member_count}
                </div>
                <Badge variant="outline" className={planColor[org.plan] || ""}>
                  {org.plan}
                </Badge>
                <Badge variant="outline" className={statusColor[org.status] || ""}>
                  {org.status}
                </Badge>
                {org.suspended_at && (
                  <Badge variant="destructive" className="text-[10px]">
                    Suspended
                  </Badge>
                )}
                {expandedId === org.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {expandedId === org.id && (
              <div className="px-4 pb-4 pt-0 border-t border-border/30">
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold font-display">{org.member_count}</p>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold font-display">{org.plan}</p>
                    <p className="text-[10px] text-muted-foreground">Plan</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold font-display">{org.status}</p>
                    <p className="text-[10px] text-muted-foreground">Status</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Org ID: <code className="text-[10px] bg-muted/50 px-1 py-0.5 rounded">{org.id}</code>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {organizations.length} organizations
      </p>
    </div>
  );
}
