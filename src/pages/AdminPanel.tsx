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
  ArrowLeft, ArrowRight, LogOut, BarChart3, TrendingUp, Clock, Mail, Eye, CheckCircle2, Zap, Target, Trash2, UserCog
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import NotificationBell from "@/components/notifications/NotificationBell";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const { lang, dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = lang === "ar";
  const PAGE_SIZE = 20;
  const [usersPage, setUsersPage] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, users: 0, tasks: 0, doneTasks: 0, inProgress: 0, overdue: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [tasksAll, setTasksAll] = useState<any[]>([]);
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
      setTasksAll(allTasks);
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">{isRtl ? "جاري التحميل..." : "Loading dashboard..."}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6" dir={dir}>
        <AlertTriangle className="h-20 w-20 text-destructive/40 mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-3">{isRtl ? "غير مصرح" : "Access Denied"}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{isRtl ? "هذه الصفحة متاحة للمديرين فقط." : "This page is restricted to administrators."}</p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          <BackIcon className="h-4 w-4 me-2" />
          {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </Button>
      </div>
    );
  }

  const getRoleForUser = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || "user";
  };

  const last7daysLogs = recentLogs.filter(l => new Date(l.created_at) > subDays(new Date(), 7));

  // Weekly activity chart data (last 14 days)
  const last14days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const weeklyActivityData = last14days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayLogs = recentLogs.filter(l => {
      const d = new Date(l.created_at);
      return d >= dayStart && d < dayEnd;
    });
    const dayTasks = (tasksAll || []).filter((t: any) => {
      const d = new Date(t.created_at);
      return d >= dayStart && d < dayEnd;
    });
    return {
      date: format(day, "MM/dd"),
      day: format(day, "EEE"),
      activities: dayLogs.length,
      tasks: dayTasks.length,
    };
  });

  // Task status distribution for pie chart
  const allTasks = tasksAll || [];
  const statusData = [
    { name: isRtl ? "معلقة" : "Backlog", value: allTasks.filter((t: any) => t.status === "backlog").length, color: "#94a3b8" },
    { name: isRtl ? "للتنفيذ" : "Todo", value: allTasks.filter((t: any) => t.status === "todo").length, color: "#3b82f6" },
    { name: isRtl ? "قيد التنفيذ" : "In Progress", value: allTasks.filter((t: any) => t.status === "in_progress").length, color: "#f59e0b" },
    { name: isRtl ? "مراجعة" : "Review", value: allTasks.filter((t: any) => t.status === "review").length, color: "#8b5cf6" },
    { name: isRtl ? "مكتملة" : "Done", value: allTasks.filter((t: any) => t.status === "done").length, color: "#10b981" },
  ].filter(s => s.value > 0);

  // Priority distribution
  const priorityData = [
    { name: isRtl ? "منخفضة" : "Low", value: allTasks.filter((t: any) => t.priority === "low").length, color: "#94a3b8" },
    { name: isRtl ? "متوسطة" : "Medium", value: allTasks.filter((t: any) => t.priority === "medium").length, color: "#3b82f6" },
    { name: isRtl ? "عالية" : "High", value: allTasks.filter((t: any) => t.priority === "high").length, color: "#f59e0b" },
    { name: isRtl ? "حرجة" : "Critical", value: allTasks.filter((t: any) => t.priority === "critical").length, color: "#ef4444" },
  ].filter(s => s.value > 0);

  const statCards = [
    { icon: FolderKanban, label: isRtl ? "المشاريع" : "Projects", value: stats.projects, gradient: "from-blue-500/10 to-blue-600/5", iconColor: "text-blue-500", borderColor: "border-blue-500/20" },
    { icon: Users, label: isRtl ? "المستخدمون" : "Users", value: stats.users, gradient: "from-violet-500/10 to-violet-600/5", iconColor: "text-violet-500", borderColor: "border-violet-500/20" },
    { icon: ListChecks, label: isRtl ? "المهام" : "Tasks", value: stats.tasks, gradient: "from-amber-500/10 to-amber-600/5", iconColor: "text-amber-500", borderColor: "border-amber-500/20" },
    { icon: CheckCircle2, label: isRtl ? "المكتملة" : "Done", value: stats.doneTasks, gradient: "from-emerald-500/10 to-emerald-600/5", iconColor: "text-emerald-500", borderColor: "border-emerald-500/20" },
    { icon: TrendingUp, label: isRtl ? "قيد التنفيذ" : "In Progress", value: stats.inProgress, gradient: "from-orange-500/10 to-orange-600/5", iconColor: "text-orange-500", borderColor: "border-orange-500/20" },
    { icon: Clock, label: isRtl ? "متأخرة" : "Overdue", value: stats.overdue, gradient: "from-red-500/10 to-red-600/5", iconColor: "text-red-500", borderColor: "border-red-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">{isRtl ? "لوحة المدير" : "Admin Dashboard"}</h1>
              <p className="text-[11px] text-muted-foreground">{isRtl ? "إدارة شاملة للمنصة" : "Platform overview & management"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={i} custom={i} variants={fadeIn} initial="hidden" animate="visible">
              <Card className={`border ${s.borderColor} bg-gradient-to-br ${s.gradient} hover:scale-[1.02] transition-transform cursor-default`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-lg bg-background/80 flex items-center justify-center`}>
                      <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Completion Rate + Quick Stats Row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{isRtl ? "معدل الإنجاز العام" : "Overall Completion Rate"}</p>
                      <p className="text-xs text-muted-foreground">{isRtl ? `${stats.doneTasks} من ${stats.tasks} مهمة` : `${stats.doneTasks} of ${stats.tasks} tasks completed`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary">{completionRate}%</span>
                  </div>
                </div>
                <Progress value={completionRate} className="h-3 rounded-full" />
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-500">{stats.doneTasks}</p>
                    <p className="text-[11px] text-muted-foreground">{isRtl ? "مكتملة" : "Completed"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-500">{stats.inProgress}</p>
                    <p className="text-[11px] text-muted-foreground">{isRtl ? "قيد التنفيذ" : "In Progress"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-500">{stats.overdue}</p>
                    <p className="text-[11px] text-muted-foreground">{isRtl ? "متأخرة" : "Overdue"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={7} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <p className="font-semibold text-foreground">{isRtl ? "نشاط سريع" : "Quick Activity"}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{isRtl ? "أنشطة آخر 7 أيام" : "Last 7 days activities"}</span>
                    <Badge variant="secondary" className="font-bold">{last7daysLogs.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{isRtl ? "رسائل جديدة" : "New contacts"}</span>
                    <Badge variant={contacts.filter(c => c.status === "new").length > 0 ? "destructive" : "secondary"} className="font-bold">
                      {contacts.filter(c => c.status === "new").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{isRtl ? "إجمالي المشاريع" : "Total projects"}</span>
                    <Badge variant="secondary" className="font-bold">{stats.projects}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{isRtl ? "مستخدمون مسجلون" : "Registered users"}</span>
                    <Badge variant="secondary" className="font-bold">{stats.users}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Advanced Analytics Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Weekly Activity Area Chart */}
          <motion.div custom={8} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {isRtl ? "النشاط خلال 14 يوم" : "14-Day Activity"}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">{isRtl ? "أنشطة + مهام" : "Activities + Tasks"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyActivityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area type="monotone" dataKey="activities" name={isRtl ? "أنشطة" : "Activities"} stroke="hsl(var(--primary))" fill="url(#actGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="tasks" name={isRtl ? "مهام جديدة" : "New Tasks"} stroke="#10b981" fill="url(#taskGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Task Status Pie Chart */}
          <motion.div custom={9} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  {isRtl ? "توزيع حالة المهام" : "Task Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد مهام" : "No tasks"}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusData.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Priority Distribution Bar Chart */}
        {priorityData.length > 0 && (
          <motion.div custom={10} variants={fadeIn} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {isRtl ? "توزيع أولويات المهام" : "Task Priority Distribution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      />
                      <Bar dataKey="value" name={isRtl ? "عدد المهام" : "Tasks"} radius={[6, 6, 0, 0]}>
                        {priorityData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="projects" dir={dir}>
          <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="projects" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <FolderKanban className="h-3.5 w-3.5" />
              {isRtl ? "المشاريع" : "Projects"}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5" />
              {isRtl ? "المستخدمون" : "Users"}
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Mail className="h-3.5 w-3.5" />
              {isRtl ? "الرسائل" : "Contacts"}
              {contacts.filter(c => c.status === "new").length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 min-w-4 ms-1">{contacts.filter(c => c.status === "new").length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm">
              <Activity className="h-3.5 w-3.5" />
              {isRtl ? "سجل التدقيق" : "Audit Log"}
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => {
                const projectTasks = recentLogs.filter(l => l.project_id === p.id).length;
                const ownerProfile = profiles.find(pr => pr.user_id === p.owner_id);
                return (
                  <motion.div key={p.id} custom={i} variants={fadeIn} initial="hidden" animate="visible">
                    <Card className="hover:shadow-lg transition-all hover:border-primary/20 group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm" style={{ backgroundColor: (p.color || "hsl(var(--primary))") + "15", color: p.color || "hsl(var(--primary))" }}>
                              {p.name?.[0]?.toUpperCase() || "P"}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                              <p className="text-[11px] text-muted-foreground">{format(new Date(p.created_at), "MMM dd, yyyy")}</p>
                            </div>
                          </div>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {ownerProfile?.display_name || (isRtl ? "مالك" : "Owner")}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {projectTasks} {isRtl ? "نشاط" : "activities"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {projects.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد مشاريع بعد" : "No projects yet"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {profiles.slice(usersPage * PAGE_SIZE, (usersPage + 1) * PAGE_SIZE).map((p, i) => {
                    const role = getRoleForUser(p.user_id);
                    const isSelf = p.user_id === user?.id;
                    return (
                      <motion.div key={p.id} custom={i} variants={fadeIn} initial="hidden" animate="visible"
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-primary/10">
                            {(p.display_name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {p.display_name || (isRtl ? "مستخدم" : "User")}
                              {isSelf && <Badge variant="outline" className="text-[10px] ms-2">{isRtl ? "أنت" : "You"}</Badge>}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{isRtl ? "انضم في" : "Joined"} {format(new Date(p.created_at), "MMM dd, yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ms-13 sm:ms-0">
                          <Select
                            value={role}
                            disabled={isSelf}
                            onValueChange={async (newRole) => {
                              const roleRecord = userRoles.find(r => r.user_id === p.user_id);
                              if (roleRecord) {
                                const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", roleRecord.id);
                                if (error) { toast.error(isRtl ? "فشل تغيير الدور" : "Failed to change role"); return; }
                              } else {
                                const { error } = await supabase.from("user_roles").insert({ user_id: p.user_id, role: newRole as any });
                                if (error) { toast.error(isRtl ? "فشل تغيير الدور" : "Failed to change role"); return; }
                              }
                              setUserRoles(prev => {
                                const existing = prev.find(r => r.user_id === p.user_id);
                                if (existing) return prev.map(r => r.user_id === p.user_id ? { ...r, role: newRole } : r);
                                return [...prev, { id: crypto.randomUUID(), user_id: p.user_id, role: newRole }];
                              });
                              toast.success(isRtl ? "تم تغيير الدور بنجاح" : "Role updated successfully");
                            }}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user"><span className="flex items-center gap-1.5"><Users className="h-3 w-3" />{isRtl ? "مستخدم" : "User"}</span></SelectItem>
                              <SelectItem value="moderator"><span className="flex items-center gap-1.5"><UserCog className="h-3 w-3" />{isRtl ? "مشرف" : "Moderator"}</span></SelectItem>
                              <SelectItem value="admin"><span className="flex items-center gap-1.5"><Shield className="h-3 w-3" />{isRtl ? "مدير" : "Admin"}</span></SelectItem>
                            </SelectContent>
                          </Select>

                          {!isSelf && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{isRtl ? "حذف المستخدم" : "Delete User"}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {isRtl
                                      ? `هل أنت متأكد من حذف "${p.display_name || "المستخدم"}"؟ سيتم حذف جميع بياناته نهائياً.`
                                      : `Are you sure you want to delete "${p.display_name || "User"}"? All their data will be permanently removed.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{isRtl ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      const { error } = await supabase.functions.invoke("admin-delete-user", {
                                        body: { user_id: p.user_id },
                                      });
                                      if (error) {
                                        toast.error(isRtl ? "فشل حذف المستخدم" : "Failed to delete user");
                                        return;
                                      }
                                      setProfiles(prev => prev.filter(x => x.id !== p.id));
                                      setUserRoles(prev => prev.filter(x => x.user_id !== p.user_id));
                                      setStats(prev => ({ ...prev, users: prev.users - 1 }));
                                      toast.success(isRtl ? "تم حذف المستخدم بنجاح" : "User deleted successfully");
                                    }}
                                  >
                                    {isRtl ? "حذف" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {profiles.length === 0 && (
                    <div className="text-center py-16">
                      <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{isRtl ? "لا يوجد مستخدمون" : "No users yet"}</p>
                    </div>
                  )}
                </div>
                {profiles.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {usersPage * PAGE_SIZE + 1}–{Math.min((usersPage + 1) * PAGE_SIZE, profiles.length)} / {profiles.length}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={usersPage === 0} onClick={() => setUsersPage(p => p - 1)}>
                        {isRtl ? "التالي" : "Previous"}
                      </Button>
                      <Button variant="outline" size="sm" disabled={(usersPage + 1) * PAGE_SIZE >= profiles.length} onClick={() => setUsersPage(p => p + 1)}>
                        {isRtl ? "السابق" : "Next"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {isRtl ? "رسائل التواصل" : "Contact Submissions"}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{contacts.length} {isRtl ? "رسالة" : "total"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {contacts.map((c: any) => (
                    <div key={c.id} className={`p-4 rounded-xl border transition-all hover:shadow-sm ${c.status === "new" ? "border-primary/30 bg-primary/[0.02]" : "border-border/30 hover:bg-muted/20"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(c.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={c.type === "demo" ? "default" : "secondary"} className="text-[10px]">
                            {c.type === "demo" ? (isRtl ? "عرض" : "Demo") : (isRtl ? "تواصل" : "Contact")}
                          </Badge>
                          <Badge variant={c.status === "new" ? "destructive" : "outline"} className="text-[10px]">
                            {c.status === "new" ? (isRtl ? "جديد" : "New") : (isRtl ? "مقروء" : "Read")}
                          </Badge>
                        </div>
                      </div>
                      {c.company && <p className="text-xs text-muted-foreground mb-1.5">🏢 {c.company}</p>}
                      <p className="text-sm text-foreground/80 leading-relaxed">{c.message}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(c.created_at), "MMM dd, yyyy HH:mm", { locale: isRtl ? ar : undefined })}
                        </span>
                        {c.status === "new" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-primary hover:text-primary"
                            onClick={async () => {
                              await supabase.from("contact_submissions" as any).update({ status: "read" } as any).eq("id", c.id);
                              setContacts(prev => prev.map(x => x.id === c.id ? { ...x, status: "read" } : x));
                            }}
                          >
                            <Eye className="h-3 w-3" />
                            {isRtl ? "تحديد كمقروء" : "Mark Read"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-16">
                      <Mail className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد رسائل بعد" : "No submissions yet"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    {isRtl ? "سجل التدقيق" : "Audit Log"}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{last7daysLogs.length} {isRtl ? "آخر 7 أيام" : "last 7 days"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentLogs.slice(auditPage * PAGE_SIZE, (auditPage + 1) * PAGE_SIZE).map((log, i) => (
                    <motion.div key={log.id} custom={i} variants={fadeIn} initial="hidden" animate="visible"
                      className="flex items-center gap-3 p-3 text-sm rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground font-medium">{log.action}</span>
                        <span className="text-muted-foreground"> — {log.entity_type}</span>
                        {log.entity_title && <span className="text-muted-foreground/70 truncate"> "{log.entity_title}"</span>}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {format(new Date(log.created_at), "MM/dd HH:mm", { locale: isRtl ? ar : undefined })}
                      </span>
                    </motion.div>
                  ))}
                  {recentLogs.length === 0 && (
                    <div className="text-center py-16">
                      <Activity className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد سجلات بعد" : "No activity logs yet"}</p>
                    </div>
                  )}
                </div>
                {recentLogs.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {auditPage * PAGE_SIZE + 1}–{Math.min((auditPage + 1) * PAGE_SIZE, recentLogs.length)} / {recentLogs.length}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={auditPage === 0} onClick={() => setAuditPage(p => p - 1)}>
                        {isRtl ? "التالي" : "Previous"}
                      </Button>
                      <Button variant="outline" size="sm" disabled={(auditPage + 1) * PAGE_SIZE >= recentLogs.length} onClick={() => setAuditPage(p => p + 1)}>
                        {isRtl ? "السابق" : "Next"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
