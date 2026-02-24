import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OrgContextType {
  orgId: string | null;
  org: { id: string; name: string; slug: string } | null;
  orgs: { id: string; name: string; slug: string; role: string }[];
  role: string | null;
  loading: boolean;
  switchOrg: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrgContextType["orgs"]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("org_memberships")
      .select("org_id, role, organizations(id, name, slug)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const mapped = (data || []).map((m: any) => ({
          id: m.organizations?.id || m.org_id,
          name: m.organizations?.name || "Unknown",
          slug: m.organizations?.slug || "",
          role: m.role,
        }));
        setOrgs(mapped);

        const savedOrgId = localStorage.getItem("active_org_id");
        const match = mapped.find((o) => o.id === savedOrgId);
        setActiveOrgId(match?.id || mapped[0]?.id || null);
        setLoading(false);
      });
  }, [user]);

  const switchOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    localStorage.setItem("active_org_id", orgId);
  };

  const activeOrg = orgs.find((o) => o.id === activeOrgId) || null;

  return (
    <OrgContext.Provider
      value={{
        orgId: activeOrgId,
        org: activeOrg ? { id: activeOrg.id, name: activeOrg.name, slug: activeOrg.slug } : null,
        orgs,
        role: activeOrg?.role || null,
        loading,
        switchOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within an OrgProvider");
  return context;
}
