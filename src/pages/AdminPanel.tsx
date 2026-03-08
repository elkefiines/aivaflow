import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  Shield, Users, FolderKanban, Activity, ListChecks, AlertTriangle,
  ArrowLeft, ArrowRight, LogOut, BarChart3, TrendingUp, Clock, Mail, Eye, CheckCircle2
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const { lang, dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = lang === "ar";
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, users: 0, tasks: 0, doneTasks: 0, inProgress: 0, overdue: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (!data) { setLoading(false); return; }

      const [projectsRes, tasksRes, profilesRes, rolesRes, contactsRes] = await Promise.all([
        supabase.from("projects").select("id, name, color, icon, created_at, owner_id, description"),
        supabase.from("tasks").select("id, status, project_id, due_date, created_at, priority"),
        supabase.from("profiles").select("id, user_id, display_name, avatar_url, created_at"),
        supabase.from("user_roles").select("*"),
        supabase.from("contact_submissions" as any).select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      const allProjects = projectsRes.data || [];
      const allTasks = tasksRes.data || [];
      const doneTasks = allTasks.filter(t => t.status === "done");
      const inProgressTasks = allTasks.filter(t => t.status === "in_progress");
      const now = new Date();
      const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done");

      setProjects(allProjects);
      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
      setContacts((contactsRes.data as any[]) || []);
      setStats({
        projects: allProjects.length,
        users: (profilesRes.data || []).length,
        tasks: allTasks.length,
        doneTasks: doneTasks.length,
        inProgress: inProgressTasks.length,
        overdue: overdueTasks.length,
      });

      const projectIds = allProjects.map(p => p.id);
      if (projectIds.length > 0) {
        const { data: logs } = await supabase
          .from("activity_logs")
          .select("*")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(100);
        setRecentLogs(logs || []);
      }

      setLoading(false);
    };
    check();
  }, [user]);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const completionRate = stats.tasks > 0 ? Math.round((stats.doneTasks / stats.tasks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6" dir={dir}>
        <AlertTriangle className="h-20 w-20 text-destructive/40 mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-3">{isRtl ? "غير مصرح" : "Access Denied"}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{isRtl ? "هذه الصفحة متاحة للمديرين فقط. تواصل مع المسؤول للحصول على صلاحيات." : "This page is restricted to administrators. Contact your admin for access."}</p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          <BackIcon className="h-4 w-4" />
          {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </Button>
      </div>
    );
  }

  const getRoleForUser = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || "user";
  };

  const recentProjects = [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const last7daysLogs = recentLogs.filter(l => new Date(l.created_at) > subDays(new Date(), 7));

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <BackIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">{isRtl ? "لوحة المدير" : "Admin Dashboard"}</h1>
                <p className="text-xs text-muted-foreground leading-tight">{isRtl ? "إدارة شاملة للمنصة" : "Platform management"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: FolderKanban, label: isRtl ? "المشاريع" : "Projects", value: stats.projects, color: "text-primary" },
            { icon: Users, label: isRtl ? "المستخدمون" : "Users", value: stats.users, color: "text-blue-500" },
            { icon: ListChecks, label: isRtl ? "المهام" : "Total Tasks", value: stats.tasks, color: "text-amber-500" },
            { icon: Activity, label: isRtl ? "المكتملة" : "Completed", value: stats.doneTasks, color: "text-green-500" },
            { icon: TrendingUp, label: isRtl ? "قيد التنفيذ" : "In Progress", value: stats.inProgress, color: "text-orange-500" },
            { icon: Clock, label: isRtl ? "متأخرة" : "Overdue", value: stats.overdue, color: "text-destructive" },
          ].map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{isRtl ? "معدل الإنجاز العام" : "Overall Completion Rate"}</span>
              </div>
              <span className="text-2xl font-bold text-primary">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {isRtl ? `${stats.doneTasks} من ${stats.tasks} مهمة مكتملة` : `${stats.doneTasks} of ${stats.tasks} tasks completed`}
            </p>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="projects" dir={dir}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="projects">{isRtl ? "المشاريع" : "Projects"}</TabsTrigger>
            <TabsTrigger value="users">{isRtl ? "المستخدمون" : "Users"}</TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {isRtl ? "الرسائل" : "Contacts"}
              {contacts.filter(c => c.status === "new").length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 min-w-4">{contacts.filter(c => c.status === "new").length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit">{isRtl ? "سجل التدقيق" : "Audit Log"}</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map(p => {
                const projectTasks = recentLogs.filter(l => l.project_id === p.id).length;
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: (p.color || "hsl(var(--primary))") + "20", color: p.color || "hsl(var(--primary))" }}>
                            {p.icon || "📁"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "yyyy-MM-dd")}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {projectTasks} {isRtl ? "نشاط" : "activities"}
                        </Badge>
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 col-span-2">{isRtl ? "لا توجد مشاريع" : "No projects yet"}</p>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {profiles.map(p => {
                    const role = getRoleForUser(p.user_id);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {(p.display_name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.display_name || (isRtl ? "مستخدم" : "User")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "yyyy-MM-dd")}</p>
                          </div>
                        </div>
                        <Badge variant={role === "admin" ? "default" : "secondary"} className="text-xs capitalize">
                          {role}
                        </Badge>
                      </div>
                    );
                  })}
                  {profiles.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">{isRtl ? "لا يوجد مستخدمون" : "No users"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{isRtl ? "سجل التدقيق" : "Audit Log"}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {last7daysLogs.length} {isRtl ? "آخر 7 أيام" : "last 7 days"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {recentLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-3 text-sm rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground font-medium">{log.action}</span>
                        <span className="text-muted-foreground"> — {log.entity_type}</span>
                        {log.entity_title && <span className="text-muted-foreground truncate"> "{log.entity_title}"</span>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(log.created_at), "MM/dd HH:mm", { locale: isRtl ? ar : undefined })}
                      </span>
                    </div>
                  ))}
                  {recentLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">{isRtl ? "لا توجد سجلات" : "No activity logs"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
