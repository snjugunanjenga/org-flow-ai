import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, X, ArrowRightLeft, UserMinus, UserPlus, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface Member {
  user_id: string;
  role: string;
  display_name: string | null;
  job_title: string | null;
  department: string | null;
}

interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
}

export default function TeamsView() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTransfer, setShowTransfer] = useState<{ userId: string; fromTeamId: string } | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "manager">("member");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [isManager, setIsManager] = useState(false);

  const loadData = async () => {
    if (!user || !orgId) return;

    const [{ data: t }, { data: m }, { data: tm }, { data: roleCheck }] = await Promise.all([
      supabase.from("teams").select("id, name, description, color").eq("org_id", orgId),
      supabase.from("org_memberships").select("user_id, role").eq("org_id", orgId),
      supabase.from("team_memberships").select("id, team_id, user_id").eq("org_id", orgId),
      supabase.from("org_memberships").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle(),
    ]);

    setTeams(t || []);
    setTeamMemberships(tm || []);
    setIsManager(roleCheck?.role === "admin" || roleCheck?.role === "manager");

    if (m && m.length > 0) {
      const userIds = m.map(x => x.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, job_title, department").in("user_id", userIds);
      const merged = m.map(x => {
        const p = profiles?.find(pr => pr.user_id === x.user_id);
        return { ...x, display_name: p?.display_name || null, job_title: p?.job_title || null, department: p?.department || null };
      });
      setMembers(merged);
    }
  };

  useEffect(() => { loadData(); }, [user, orgId]);

  const getTeamMembers = (teamId: string) => {
    const memberIds = teamMemberships.filter(tm => tm.team_id === teamId).map(tm => tm.user_id);
    return members.filter(m => memberIds.includes(m.user_id));
  };

  const getUnassignedMembers = () => {
    const assignedIds = teamMemberships.map(tm => tm.user_id);
    return members.filter(m => !assignedIds.includes(m.user_id));
  };

  const handleAddToTeam = async (userId: string, teamId: string) => {
    if (!orgId) return;
    const { error } = await supabase.from("team_memberships").insert({ org_id: orgId, team_id: teamId, user_id: userId, assigned_by: user?.id });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Member added to team" });
    setShowAddMember(false);
    setAddMemberUserId("");
    loadData();
  };

  const handleRemoveFromTeam = async (userId: string, teamId: string) => {
    const tm = teamMemberships.find(t => t.team_id === teamId && t.user_id === userId);
    if (!tm) return;
    const { error } = await supabase.from("team_memberships").delete().eq("id", tm.id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Member removed from team" });
    loadData();
  };

  const handleTransfer = async (userId: string, fromTeamId: string, toTeamId: string) => {
    if (!orgId) return;
    const tm = teamMemberships.find(t => t.team_id === fromTeamId && t.user_id === userId);
    if (tm) await supabase.from("team_memberships").delete().eq("id", tm.id);
    await supabase.from("team_memberships").insert({ org_id: orgId, team_id: toTeamId, user_id: userId, assigned_by: user?.id });
    toast({ title: "Member transferred" });
    setShowTransfer(null);
    loadData();
  };

  const handleCreateTeam = async () => {
    if (!orgId || !newTeamName.trim()) return;
    const { error } = await supabase.from("teams").insert({ name: newTeamName.trim(), description: newTeamDesc.trim() || null, org_id: orgId, created_by: user?.id });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Team created" });
    setShowCreateTeam(false);
    setNewTeamName("");
    setNewTeamDesc("");
    loadData();
  };

  const handleSendInvite = async () => {
    if (!orgId || !inviteEmail.trim()) return;
    const { data, error } = await supabase.functions.invoke("send-invite", {
      body: { email: inviteEmail.trim(), org_id: orgId, role: inviteRole },
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Invite sent", description: data?.invite_link ? "Invite link generated." : "Invitation sent." });
    setShowInvite(false);
    setInviteEmail("");
  };

  const handleRemoveMember = async (userId: string) => {
    if (!orgId) return;
    // Remove from all teams first
    const tms = teamMemberships.filter(tm => tm.user_id === userId);
    for (const tm of tms) {
      await supabase.from("team_memberships").delete().eq("id", tm.id);
    }
    // Remove org membership
    const { error } = await supabase.from("org_memberships").delete().eq("org_id", orgId).eq("user_id", userId);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Member removed" });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your organization's teams and members.</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}><Mail className="h-4 w-4 mr-1" /> Invite</Button>
            <Button size="sm" onClick={() => setShowCreateTeam(true)}><Plus className="h-4 w-4 mr-1" /> New Team</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map(t => {
          const teamMembers = getTeamMembers(t.id);
          return (
            <button key={t.id} onClick={() => setSelectedTeam(t)} className="glass-panel p-5 text-left hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || "#6366f1" }} />
                <h3 className="font-semibold font-display">{t.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{teamMembers.length} members</p>
            </button>
          );
        })}
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">All Members ({members.length})</h3>
        <div className="space-y-3">
          {members.map(m => {
            const memberTeams = teamMemberships.filter(tm => tm.user_id === m.user_id).map(tm => teams.find(t => t.id === tm.team_id)?.name).filter(Boolean);
            return (
              <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{m.job_title} · {m.department} {memberTeams.length > 0 && `· ${memberTeams.join(", ")}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{m.role}</span>
                  {isManager && m.user_id !== user?.id && (
                    <button onClick={() => handleRemoveMember(m.user_id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Remove member">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team detail dialog */}
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTeam?.color || "#6366f1" }} />{selectedTeam?.name}</DialogTitle></DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedTeam.description || "No description."}</p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Team Members</h4>
                  {isManager && <Button size="sm" variant="outline" onClick={() => { setShowAddMember(true); setTargetTeamId(selectedTeam.id); }}><UserPlus className="h-3 w-3 mr-1" /> Add</Button>}
                </div>
                <div className="space-y-2">
                  {getTeamMembers(selectedTeam.id).map(m => (
                    <div key={m.user_id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{m.display_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{m.job_title}</p>
                      </div>
                      {isManager && (
                        <div className="flex gap-1">
                          <button onClick={() => setShowTransfer({ userId: m.user_id, fromTeamId: selectedTeam.id })} className="text-muted-foreground hover:text-primary transition-colors" title="Transfer">
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleRemoveFromTeam(m.user_id, selectedTeam.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {getTeamMembers(selectedTeam.id).length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add member to team dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Member to Team</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {members.map(m => (
              <button key={m.user_id} onClick={() => handleAddToTeam(m.user_id, targetTeamId)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors text-left">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{m.display_name || "Unknown"}</span>
                <span className="text-xs text-muted-foreground ml-auto">{m.role}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer member dialog */}
      <Dialog open={!!showTransfer} onOpenChange={() => setShowTransfer(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Transfer to Team</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {teams.filter(t => t.id !== showTransfer?.fromTeamId).map(t => (
              <button key={t.id} onClick={() => showTransfer && handleTransfer(showTransfer.userId, showTransfer.fromTeamId, t.id)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors text-left">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || "#6366f1" }} />
                <span className="text-sm">{t.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create team dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Team</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Team name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Description (optional)" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} className="bg-secondary/50" />
            <Button className="w-full" onClick={handleCreateTeam}>Create Team</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="bg-secondary/50" />
            <Select value={inviteRole} onValueChange={v => setInviteRole(v as "member" | "manager")}>
              <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleSendInvite}>Send Invite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
