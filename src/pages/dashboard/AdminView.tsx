import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CreditCard, BarChart3, Mail, Building2, ClipboardList, Loader2 } from "lucide-react";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminSubscriptionsTab } from "@/components/admin/AdminSubscriptionsTab";
import { AdminNewslettersTab } from "@/components/admin/AdminNewslettersTab";
import { AdminOrganizationsTab } from "@/components/admin/AdminOrganizationsTab";
import { AdminAuditLogTab } from "@/components/admin/AdminAuditLogTab";

export default function AdminView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalOrgs: 0, totalUsers: 0, freePlans: 0, proPlans: 0,
    enterprisePlans: 0, trialingCount: 0, activeCount: 0,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: subs }, { data: nls }, { data: orgs }, { data: members }, { data: audit }] =
      await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_newsletters").select("*").order("sent_at", { ascending: false }).limit(20),
        supabase.from("organizations").select("id, name, slug, created_at, suspended_at"),
        supabase.from("org_memberships").select("id, org_id"),
        supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

    const orgMap = new Map((orgs || []).map((o: any) => [o.id, o]));
    const memberCounts = new Map<string, number>();
    (members || []).forEach((m: any) => {
      memberCounts.set(m.org_id, (memberCounts.get(m.org_id) || 0) + 1);
    });

    const enrichedSubs = (subs || []).map((s: any) => ({
      ...s,
      org_name: orgMap.get(s.org_id)?.name || "Unknown",
    }));

    const subMap = new Map((subs || []).map((s: any) => [s.org_id, s]));
    const enrichedOrgs = (orgs || []).map((o: any) => ({
      ...o,
      member_count: memberCounts.get(o.id) || 0,
      plan: subMap.get(o.id)?.plan || "free",
      status: subMap.get(o.id)?.status || "none",
    }));

    setSubscriptions(enrichedSubs);
    setNewsletters(nls || []);
    setOrganizations(enrichedOrgs);
    setAuditEntries(audit || []);

    const free = enrichedSubs.filter((s: any) => s.plan === "free").length;
    const pro = enrichedSubs.filter((s: any) => s.plan === "pro").length;
    const ent = enrichedSubs.filter((s: any) => s.plan === "enterprise").length;
    setAnalytics({
      totalOrgs: orgs?.length || 0,
      totalUsers: members?.length || 0,
      freePlans: free, proPlans: pro, enterprisePlans: ent,
      trialingCount: enrichedSubs.filter((s: any) => s.status === "trialing").length,
      activeCount: enrichedSubs.filter((s: any) => s.status === "active").length,
    });
    setLoading(false);
  };

  const updateSubscription = async (id: string, plan: string, status: string) => {
    const { error } = await supabase.from("subscriptions").update({ plan, status }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      // Log audit
      if (user) {
        await supabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action: "subscription_updated",
          target_type: "subscription",
          target_id: id,
          metadata: { plan, status },
        });
      }
      toast({ title: "Subscription updated" });
      loadData();
    }
  };

  const sendNewsletter = async (subject: string, body: string, audience: string) => {
    if (!subject || !body || !user) return;
    setSending(true);
    const { error } = await supabase.from("admin_newsletters").insert({
      subject, body, sent_by: user.id, target_audience: audience, status: "sent",
    });
    if (!error) {
      await supabase.from("admin_audit_log").insert({
        admin_user_id: user.id,
        action: "newsletter_sent",
        target_type: "newsletter",
        metadata: { subject, target_audience: audience },
      });
    }
    setSending(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Newsletter saved & sent" });
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-display">Platform Admin</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscriptions, view analytics, and communicate with organizations.
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" /> Organizations
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="newsletters" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> Newsletters
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdminAnalyticsTab analytics={analytics} />
        </TabsContent>
        <TabsContent value="organizations">
          <AdminOrganizationsTab organizations={organizations} />
        </TabsContent>
        <TabsContent value="subscriptions">
          <AdminSubscriptionsTab subscriptions={subscriptions} onUpdate={updateSubscription} />
        </TabsContent>
        <TabsContent value="newsletters">
          <AdminNewslettersTab newsletters={newsletters} onSend={sendNewsletter} sending={sending} />
        </TabsContent>
        <TabsContent value="audit">
          <AdminAuditLogTab entries={auditEntries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
