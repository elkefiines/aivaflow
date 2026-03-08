import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, FolderKanban, Activity, ListChecks, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AdminPanel = () => {
  const { user } = useAuth();
  const { lang, dir } = useLanguage();
  const isRtl = lang === "ar";
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, users: 0, tasks: 0, doneTasks: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (!data) { setLoading(false); return; }

      // Fetch admin stats - projects owned by this user
      const [projectsRes, tasksRes] = await Promise.all([
        supabase.from("projects").select("id, name, color, created_at, owner_id"),
        supabase.from("tasks").select("id, status, project_id"),
      ]);

      const allProjects = projectsRes.data || [];
      const allTasks = tasksRes.data || [];
      const doneTasks = allTasks.filter(t => t.status === "done");

      setProjects(allProjects);
      setStats({
        projects: allProjects.length,
        users: new Set(allProjects.map(p => p.owner_id)).size,
        tasks: allTasks.length,
        doneTasks: doneTasks.length,
      });

      // Fetch recent activity logs
      const projectIds = allProjects.map(p => p.id);
      if (projectIds.length > 0) {
        const { data: logs } = await supabase
          .from("activity_logs")
          .select("*")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(50);
        setRecentLogs(logs || []);
      }

      // Fetch user roles
      const { data: roles } = await supabase.from("user_roles").select("*");
      setUserRoles(roles || []);

      setLoading(false);
    };
    check();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center" dir={dir}>
        <AlertTriangle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">{isRtl ? "غير مصرح" : "Access Denied"}</h2>
        <p className="text-muted-foreground">{isRtl ? "هذه الصفحة متاحة للمديرين فقط" : "This page is only available to admins"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {isRtl ? "لوحة تحكم المدير" : "Admin Panel"}
        </h1>
        <p className="text-muted-foreground text-sm">{isRtl ? "إحصائيات شاملة وإدارة المنصة" : "Platform-wide stats and management"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FolderKanban, label: isRtl ? "المشاريع" : "Projects", value: stats.projects, color: "text-primary" },
          { icon: Users, label: isRtl ? "المستخدمون" : "Users", value: stats.users, color: "text-blue-500" },
          { icon: ListChecks, label: isRtl ? "المهام" : "Tasks", value: stats.tasks, color: "text-amber-500" },
          { icon: Activity, label: isRtl ? "المكتملة" : "Completed", value: stats.doneTasks, color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="projects" dir={dir}>
        <TabsList>
          <TabsTrigger value="projects">{isRtl ? "المشاريع" : "Projects"}</TabsTrigger>
          <TabsTrigger value="audit">{isRtl ? "سجل التدقيق" : "Audit Log"}</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRtl ? "جميع المشاريع" : "All Projects"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "yyyy-MM-dd")}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {(stats.tasks > 0 ? Math.round(((recentLogs.filter(l => l.project_id === p.id).length) / Math.max(recentLogs.length, 1)) * 100) : 0)}% {isRtl ? "نشاط" : "activity"}
                    </Badge>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{isRtl ? "لا توجد مشاريع" : "No projects"}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRtl ? "سجل التدقيق" : "Audit Log"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-2 text-sm border-b border-border/10 last:border-0">
                    <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
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
                {recentLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{isRtl ? "لا توجد سجلات" : "No logs"}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
