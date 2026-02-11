import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, Mail, ArrowRight, ArrowLeft, Plus, X, Check, Copy } from "lucide-react";

const SUGGESTED_TEAMS = ["Engineering", "Product", "Design", "Sales", "Marketing", "Legal", "HR", "Operations"];

const TEAM_COLORS: Record<string, string> = {
  Engineering: "#6366f1",
  Product: "#8b5cf6",
  Design: "#ec4899",
  Sales: "#f59e0b",
  Marketing: "#10b981",
  Legal: "#6b7280",
  HR: "#ef4444",
  Operations: "#3b82f6",
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [teams, setTeams] = useState<string[]>(SUGGESTED_TEAMS);
  const [newTeam, setNewTeam] = useState("");
  const [invites, setInvites] = useState<{ email: string; role: "member" | "manager" }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "manager">("member");
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !user) return;
    setLoading(true);
    try {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName.trim(), slug, created_by: user.id })
        .select()
        .single();
      if (orgError) throw orgError;

      // Add self as admin member
      const { error: memError } = await supabase
        .from("org_memberships")
        .insert({ org_id: org.id, user_id: user.id, role: "admin" as const });
      if (memError) throw memError;

      // Add admin role to user_roles
      await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" as const });

      setOrgId(org.id);
      setStep(1);
      toast({ title: "Organization created!", description: `${orgName} is ready.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeams = async () => {
    if (!orgId || !user) return;
    setLoading(true);
    try {
      for (const teamName of teams) {
        await supabase.from("teams").insert({
          name: teamName,
          org_id: orgId,
          created_by: user.id,
          color: TEAM_COLORS[teamName] || "#6366f1",
        });
      }
      setStep(2);
      toast({ title: "Teams created!", description: `${teams.length} teams set up.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvite = () => {
    if (!inviteEmail.trim()) return;
    if (invites.some((i) => i.email === inviteEmail.trim())) {
      toast({ variant: "destructive", title: "Already added", description: "This email is already in the list." });
      return;
    }
    setInvites([...invites, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteEmail("");
  };

  const handleSendInvites = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const links: Record<string, string> = {};
      for (const invite of invites) {
        const { data, error } = await supabase.functions.invoke("send-invite", {
          body: { email: invite.email, org_id: orgId, role: invite.role },
        });
        if (error) {
          console.error(`Invite error for ${invite.email}:`, error);
          continue;
        }
        if (data?.invite_link) {
          links[invite.email] = data.invite_link;
        }
      }
      setInviteLinks(links);
      toast({ title: "Invitations sent!", description: `${Object.keys(links).length} invite links generated.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user!.id);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Invite link copied to clipboard." });
  };

  const steps = [
    { icon: Building2, label: "Create Organization" },
    { icon: Users, label: "Set Up Teams" },
    { icon: Mail, label: "Invite Members" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-8">
              <h2 className="text-2xl font-bold font-display mb-2">Create your organization</h2>
              <p className="text-muted-foreground mb-6">Give your organization a name to get started.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" placeholder="e.g. Acme Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-secondary/50 border-border/50" />
                  {slug && <p className="text-xs text-muted-foreground">Slug: {slug}</p>}
                </div>
                <Button onClick={handleCreateOrg} disabled={!orgName.trim() || loading} className="w-full">
                  {loading ? "Creating..." : "Create Organization"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-8">
              <h2 className="text-2xl font-bold font-display mb-2">Set up your teams</h2>
              <p className="text-muted-foreground mb-6">We've suggested some common teams. Add or remove as needed.</p>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                      {t}
                      <button onClick={() => setTeams(teams.filter((x) => x !== t))} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add a team..." value={newTeam} onChange={(e) => setNewTeam(e.target.value)} onKeyDown={(e) => {
                    if (e.key === "Enter" && newTeam.trim()) {
                      setTeams([...teams, newTeam.trim()]);
                      setNewTeam("");
                    }
                  }} className="bg-secondary/50 border-border/50" />
                  <Button variant="outline" size="icon" onClick={() => { if (newTeam.trim()) { setTeams([...teams, newTeam.trim()]); setNewTeam(""); } }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)} disabled={!!orgId}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button onClick={handleCreateTeams} disabled={teams.length === 0 || loading} className="flex-1">
                    {loading ? "Creating teams..." : "Create Teams"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-8">
              <h2 className="text-2xl font-bold font-display mb-2">Invite your team</h2>
              <p className="text-muted-foreground mb-6">Add team members by email. You can also do this later.</p>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="colleague@company.com" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddInvite(); }} className="bg-secondary/50 border-border/50 flex-1" />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "member" | "manager")} className="rounded-md border border-border/50 bg-secondary/50 px-3 text-sm">
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                  </select>
                  <Button variant="outline" size="icon" onClick={handleAddInvite}><Plus className="h-4 w-4" /></Button>
                </div>

                {invites.length > 0 && (
                  <div className="space-y-2">
                    {invites.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{inv.email}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{inv.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {inviteLinks[inv.email] && (
                            <button onClick={() => copyLink(inviteLinks[inv.email])} className="text-primary hover:text-primary/80">
                              <Copy className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => setInvites(invites.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {invites.length > 0 && Object.keys(inviteLinks).length === 0 && (
                  <Button onClick={handleSendInvites} disabled={loading} variant="outline" className="w-full">
                    {loading ? "Generating links..." : "Generate Invite Links"}
                  </Button>
                )}

                {Object.keys(inviteLinks).length > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Invite links generated! Share them with your team.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button onClick={handleComplete} disabled={loading} className="flex-1">
                    {loading ? "Finishing..." : invites.length === 0 ? "Skip & Go to Dashboard" : "Go to Dashboard"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
