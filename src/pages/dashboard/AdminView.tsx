import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CreditCard,
  BarChart3,
  Mail,
  Send,
  Loader2,
  Users,
  Building2,
  TrendingUp,
} from "lucide-react";

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

interface Newsletter {
  id: string;
  subject: string;
  body: string;
  target_audience: string;
  sent_at: string;
}

export default function AdminView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  // Newsletter form
  const [nlSubject, setNlSubject] = useState("");
  const [nlBody, setNlBody] = useState("");
  const [nlAudience, setNlAudience] = useState("all");
  const [sending, setSending] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    freePlans: 0,
    proPlans: 0,
    enterprisePlans: 0,
    trialingCount: 0,
    activeCount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: subs }, { data: nls }, { data: orgs }, { data: members }] =
      await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("admin_newsletters")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(20),
        supabase.from("organizations").select("id, name"),
        supabase.from("org_memberships").select("id"),
      ]);

    const orgMap = new Map(
      (orgs || []).map((o: any) => [o.id, o.name])
    );

    const enriched = (subs || []).map((s: any) => ({
      ...s,
      org_name: orgMap.get(s.org_id) || "Unknown",
    }));

    setSubscriptions(enriched);
    setNewsletters((nls as Newsletter[]) || []);

    const free = enriched.filter((s: any) => s.plan === "free").length;
    const pro = enriched.filter((s: any) => s.plan === "pro").length;
    const ent = enriched.filter((s: any) => s.plan === "enterprise").length;
    const trialing = enriched.filter((s: any) => s.status === "trialing").length;
    const active = enriched.filter((s: any) => s.status === "active").length;

    setAnalytics({
      totalOrgs: orgs?.length || 0,
      totalUsers: members?.length || 0,
      freePlans: free,
      proPlans: pro,
      enterprisePlans: ent,
      trialingCount: trialing,
      activeCount: active,
    });

    setLoading(false);
  };

  const sendNewsletter = async () => {
    if (!nlSubject.trim() || !nlBody.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("admin_newsletters").insert({
      subject: nlSubject.trim(),
      body: nlBody.trim(),
      sent_by: user.id,
      target_audience: nlAudience,
    });
    setSending(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Newsletter saved & sent" });
      setNlSubject("");
      setNlBody("");
      loadData();
    }
  };

  const updateSubscription = async (id: string, plan: string, status: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan, status })
      .eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Subscription updated" });
      loadData();
    }
  };

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
          <TabsTrigger value="subscriptions" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="newsletters" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> Newsletters
          </TabsTrigger>
        </TabsList>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
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
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
              <p className="text-muted-foreground text-sm">
                Subscriptions will appear here when organizations sign up.
              </p>
            </div>
          ) : (
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
                      onValueChange={(v) => updateSubscription(sub.id, v, sub.status)}
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
                      onValueChange={(v) => updateSubscription(sub.id, sub.plan, v)}
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
          )}
        </TabsContent>

        {/* Newsletters */}
        <TabsContent value="newsletters" className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-semibold font-display">Compose Newsletter</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input
                  value={nlSubject}
                  onChange={(e) => setNlSubject(e.target.value)}
                  placeholder="Newsletter subject..."
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="space-y-1">
                <Label>Body</Label>
                <Textarea
                  value={nlBody}
                  onChange={(e) => setNlBody(e.target.value)}
                  placeholder="Write your newsletter content..."
                  rows={8}
                  className="bg-secondary/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label>Target Audience</Label>
                  <Select value={nlAudience} onValueChange={setNlAudience}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      <SelectItem value="free">Free Plan Only</SelectItem>
                      <SelectItem value="pro">Pro Plan Only</SelectItem>
                      <SelectItem value="enterprise">Enterprise Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={sendNewsletter}
                  disabled={sending || !nlSubject.trim() || !nlBody.trim()}
                  className="mt-auto"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Newsletter
                </Button>
              </div>
            </div>
          </div>

          {newsletters.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Sent Newsletters
              </h3>
              {newsletters.map((nl) => (
                <div key={nl.id} className="glass-panel p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{nl.subject}</h4>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {nl.target_audience}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {nl.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Sent {new Date(nl.sent_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
