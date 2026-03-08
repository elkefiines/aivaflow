import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Loader2, UserPlus, Trash2, ListTodo, Clock, CheckCircle2, UserCheck, Plus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const { projectId } = useActiveProject();
  const { t, lang, dir } = useLanguage();
  const isRtl = lang === "ar";
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<{ assignee_id: string | null; status: string | null }[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addTab, setAddTab] = useState<"new" | "existing">("new");

  // Existing members from other projects owned by this user
  const [otherMembers, setOtherMembers] = useState<{ user_id: string; display_name: string }[]>([]);
  const [addingExisting, setAddingExisting] = useState<string | null>(null);

  const load = async () => {
    if (!projectId || !user) return;
    setLoading(true);

    const [membersRes, tasksRes, projectRes] = await Promise.all([
      supabase.from("project_members").select("*").eq("project_id", projectId),
      supabase.from("tasks").select("assignee_id, status").eq("project_id", projectId),
      supabase.from("projects").select("owner_id").eq("id", projectId).single(),
    ]);

    const ownerId = projectRes.data?.owner_id;
    const ownerCheck = ownerId === user.id;
    setIsOwner(ownerCheck);
    setTasks(tasksRes.data || []);

    const rawMembers = membersRes.data || [];
    
    // Collect all user IDs: members + owner
    const memberUserIds = rawMembers.map(m => m.user_id);
    const allUserIds = [...new Set([...memberUserIds, ...(ownerId ? [ownerId] : [])])];

    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", allUserIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));
      
      // Build members list including owner
      const membersList: Member[] = rawMembers.map(m => ({ ...m, display_name: profileMap.get(m.user_id) || "Unknown" }));
      
      // Add owner as a virtual member if not already in project_members
      if (ownerId && !memberUserIds.includes(ownerId)) {
        membersList.unshift({
          id: `owner-${ownerId}`,
          user_id: ownerId,
          role: "owner",
          joined_at: projectRes.data ? "" : "",
          display_name: profileMap.get(ownerId) || "Owner",
        });
      }
      
      setMembers(membersList);
    } else {
      setMembers([]);
    }

    // Load members from other projects owned by user (for "add existing" feature)
    if (ownerCheck) {
      const { data: myProjects } = await supabase.from("projects").select("id").eq("owner_id", user.id);
      const otherProjectIds = (myProjects || []).map(p => p.id).filter(id => id !== projectId);

      if (otherProjectIds.length > 0) {
        const { data: otherMembersData } = await supabase
          .from("project_members")
          .select("user_id")
          .in("project_id", otherProjectIds);

        const otherUserIds = [...new Set((otherMembersData || []).map(m => m.user_id))]
          .filter(uid => uid !== user.id && !memberUserIds.includes(uid));

        if (otherUserIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", otherUserIds);
          setOtherMembers((profiles || []).map(p => ({ user_id: p.user_id, display_name: p.display_name || "User" })));
        } else {
          setOtherMembers([]);
        }
      } else {
        setOtherMembers([]);
      }
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId, user]);

  const addMember = async () => {
    if (!projectId || !user || !addEmail.trim() || !addPassword.trim()) return;
    if (addPassword.length < 6) { toast.error(t("passwordMinLength")); return; }
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: { email: addEmail.trim().toLowerCase(), password: addPassword, displayName: addName.trim() || addEmail.trim().split("@")[0], projectId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(t("memberAdded"));
      setAddEmail(""); setAddPassword(""); setAddName("");
      load();
    } catch (err: any) {
      toast.error(err.message || t("failedToAddMember"));
    } finally {
      setAdding(false);
    }
  };

  const addExistingMember = async (userId: string) => {
    if (!projectId || !user) return;
    setAddingExisting(userId);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: { projectId, existingUserId: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(isRtl ? "تمت إضافة العضو للمشروع" : "Member added to project");
      load();
    } catch (err: any) {
      toast.error(err.message || (isRtl ? "فشل في إضافة العضو" : "Failed to add member"));
    } finally {
      setAddingExisting(null);
    }
  };

  const removeMember = async (id: string) => {
    await supabase.from("project_members").delete().eq("id", id);
    toast.success("Member removed");
    load();
  };

  const getWorkload = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignee_id === userId);
    return { total: userTasks.length, done: userTasks.filter(t => t.status === "done").length, inProgress: userTasks.filter(t => t.status === "in_progress").length };
  };

  return (
    <div className="space-y-4 sm:space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("teamTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("teamSubtitle")}</p>
      </div>

      {isOwner && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-3 sm:p-4">
            <Tabs value={addTab} onValueChange={(v) => setAddTab(v as "new" | "existing")} dir={dir}>
              <TabsList className="mb-3 w-full justify-start">
                <TabsTrigger value="new" className="gap-1.5 text-xs">
                  <UserPlus className="h-3.5 w-3.5" />
                  {isRtl ? "عضو جديد" : "New Member"}
                </TabsTrigger>
                <TabsTrigger value="existing" className="gap-1.5 text-xs">
                  <UserCheck className="h-3.5 w-3.5" />
                  {isRtl ? "عضو موجود" : "Existing Member"}
                  {otherMembers.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">{otherMembers.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-0">
                <form onSubmit={(e) => { e.preventDefault(); addMember(); }} className="flex flex-col sm:flex-row gap-2">
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder={t("displayName")} className="bg-background/50 border-border/50 sm:max-w-[160px]" />
                  <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder={t("emailAddress")} type="email" required className="bg-background/50 border-border/50" dir="ltr" />
                  <Input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder={t("password")} type="password" required minLength={6} className="bg-background/50 border-border/50 sm:max-w-[160px]" dir="ltr" />
                  <Button disabled={adding || !addEmail.trim() || !addPassword.trim()} className="shrink-0">
                    {adding ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <UserPlus className="h-4 w-4 me-2" />}
                    {t("add")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="existing" className="mt-0">
                {otherMembers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {otherMembers.map((m, idx) => {
                      const initials = (m.display_name || "U").split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
                      return (
                        <div key={m.user_id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`text-xs font-semibold ${avatarColors[idx % avatarColors.length]}`}>{initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">{m.display_name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            disabled={addingExisting === m.user_id}
                            onClick={() => addExistingMember(m.user_id)}
                          >
                            {addingExisting === m.user_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            {isRtl ? "إضافة" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <UserCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? "لا يوجد أعضاء من مشاريع أخرى يمكن إضافتهم" : "No members from other projects to add"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, idx) => {
            const w = getWorkload(m.user_id);
            const initials = (m.display_name || "U").split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
            return (
              <Card key={m.id} className="border-border/40 bg-card/80 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/member/${m.user_id}`)}>
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
                    {isOwner && m.user_id !== user?.id && !m.id.startsWith("owner-") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("confirmRemoveMember")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeMember(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {t("confirmDelete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
      )}
    </div>
  );
};

export default Team;
