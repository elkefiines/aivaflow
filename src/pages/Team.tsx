import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, Loader2, UserPlus, Trash2, ListTodo, Clock, CheckCircle2 } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string | null;
  joined_at: string;
  display_name?: string;
}

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-purple-500/20 text-purple-400",
  "bg-rose-500/20 text-rose-400",
];

const Team = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { t, dir } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<{ assignee_id: string | null; status: string | null }[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const load = async () => {
    if (!projectId || !user) return;

    const [membersRes, tasksRes, projectRes] = await Promise.all([
      supabase.from("project_members").select("*").eq("project_id", projectId),
      supabase.from("tasks").select("assignee_id, status").eq("project_id", projectId),
      supabase.from("projects").select("owner_id").eq("id", projectId).single(),
    ]);

    setIsOwner(projectRes.data?.owner_id === user.id);
    setTasks(tasksRes.data || []);

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

  const addMember = async () => {
    if (!projectId || !user || !addEmail.trim() || !addPassword.trim()) return;
    if (addPassword.length < 6) { toast.error(t("passwordMinLength")); return; }
    setAdding(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          email: addEmail.trim().toLowerCase(),
          password: addPassword,
          displayName: addName.trim() || addEmail.trim().split("@")[0],
          projectId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(t("memberAdded"));
      setAddEmail("");
      setAddPassword("");
      setAddName("");
      load();
    } catch (err: any) {
      toast.error(err.message || t("failedToAddMember"));
    } finally {
      setAdding(false);
    }
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
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("teamTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("teamSubtitle")}</p>
      </div>

      {isOwner && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <form onSubmit={(e) => { e.preventDefault(); addMember(); }} className="flex gap-2">
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={t("displayName")}
                className="bg-background/50 border-border/50 max-w-[160px]"
              />
              <Input
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder={t("emailAddress")}
                type="email"
                required
                className="bg-background/50 border-border/50"
                dir="ltr"
              />
              <Input
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder={t("password")}
                type="password"
                required
                minLength={6}
                className="bg-background/50 border-border/50 max-w-[160px]"
                dir="ltr"
              />
              <Button disabled={adding || !addEmail.trim() || !addPassword.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <UserPlus className="h-4 w-4 me-2" />}
                {t("add")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m, idx) => {
          const w = getWorkload(m.user_id);
          const initials = (m.display_name || "U").split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
          return (
            <Card key={m.id} className="border-border/40 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`text-sm font-semibold ${avatarColors[idx % avatarColors.length]}`}>{initials}</AvatarFallback>
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
                  <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{w.total} {t("tasksCount")}</span>
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
            <p className="text-muted-foreground text-sm">{t("noMembers")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;