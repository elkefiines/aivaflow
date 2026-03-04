import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, Mail, Loader2, UserPlus, Trash2, ListTodo, Clock, CheckCircle2 } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string | null;
  joined_at: string;
  display_name?: string;
  email?: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  role: string | null;
  status: string | null;
  created_at: string;
}

const Team = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tasks, setTasks] = useState<{ assignee_id: string | null; status: string | null }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const load = async () => {
    if (!projectId || !user) return;

    const [membersRes, invRes, tasksRes, projectRes] = await Promise.all([
      supabase.from("project_members").select("*").eq("project_id", projectId),
      supabase.from("invitations").select("*").eq("project_id", projectId).eq("status", "pending"),
      supabase.from("tasks").select("assignee_id, status").eq("project_id", projectId),
      supabase.from("projects").select("owner_id").eq("id", projectId).single(),
    ]);

    setIsOwner(projectRes.data?.owner_id === user.id);
    setTasks(tasksRes.data || []);
    setInvitations(invRes.data || []);

    // Enrich members with profile data
    const rawMembers = membersRes.data || [];
    const userIds = rawMembers.map(m => m.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));

    setMembers(rawMembers.map(m => ({
      ...m,
      display_name: profileMap.get(m.user_id) || "Unknown",
    })));
  };

  useEffect(() => { load(); }, [projectId, user]);

  const sendInvite = async () => {
    if (!projectId || !user || !inviteEmail.trim()) return;
    setInviting(true);
    const { error } = await supabase.from("invitations").insert({
      project_id: projectId,
      invited_by: user.id,
      invited_email: inviteEmail.trim().toLowerCase(),
      role: "member",
    });
    setInviting(false);
    if (error) { toast.error("Failed to send invitation"); return; }
    toast.success("Invitation sent");
    setInviteEmail("");
    load();
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("invitations").delete().eq("id", id);
    load();
  };

  const removeMember = async (id: string) => {
    await supabase.from("project_members").delete().eq("id", id);
    toast.success("Member removed");
    load();
  };

  const getWorkload = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignee_id === userId);
    return {
      total: userTasks.length,
      done: userTasks.filter(t => t.status === "done").length,
      inProgress: userTasks.filter(t => t.status === "in_progress").length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage members and track workload</p>
      </div>

      {/* Invite */}
      {isOwner && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <form onSubmit={(e) => { e.preventDefault(); sendInvite(); }} className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@email.com"
                type="email"
                className="bg-background/50 border-border/50"
              />
              <Button disabled={inviting || !inviteEmail.trim()}>
                {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const w = getWorkload(m.user_id);
          const initials = (m.display_name || "U").split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
          return (
            <Card key={m.id} className="border-border/40 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.display_name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{m.role || "member"}</Badge>
                    </div>
                  </div>
                  {isOwner && m.user_id !== user?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeMember(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{w.total} tasks</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-400" />{w.inProgress}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" />{w.done}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {members.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No team members yet.</p>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-display">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/20">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{inv.invited_email}</span>
                  <Badge variant="outline" className="text-[10px]">{inv.role}</Badge>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteInvitation(inv.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Team;
