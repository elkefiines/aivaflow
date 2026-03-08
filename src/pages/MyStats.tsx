import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CheckCircle2, Clock, TrendingUp, TrendingDown, Flame, Target, Timer, ListChecks } from "lucide-react";
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "framer-motion";
import AchievementsPanel from "@/components/achievements/AchievementsPanel";
import { SHORTCUT_LIST } from "@/hooks/useKeyboardShortcuts";

const MyStats = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { lang, t } = useLanguage();
  const isRtl = lang === "ar";

  const [tasks, setTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) return;
    const fetch = async () => {
      setLoading(true);
      const [tasksRes, timeRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("time_entries").select("*").eq("user_id", user.id),
      ]);
      setTasks(tasksRes.data || []);
      setTimeEntries(timeRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user, projectId]);

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // My tasks
  const myTasks = useMemo(() => tasks.filter(t => t.assignee_id === user?.id || t.created_by === user?.id), [tasks, user]);
  const myDone = useMemo(() => myTasks.filter(t => t.status === "done"), [myTasks]);
  const myInProgress = useMemo(() => myTasks.filter(t => t.status === "in_progress"), [myTasks]);
  const myOverdue = useMemo(() => myTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done"), [myTasks]);

  // This week vs last week
  const doneThisWeek = useMemo(() => myDone.filter(t => {
    const d = parseISO(t.updated_at);
    return isWithinInterval(d, { start: thisWeekStart, end: thisWeekEnd });
  }), [myDone, thisWeekStart, thisWeekEnd]);

  const doneLastWeek = useMemo(() => myDone.filter(t => {
    const d = parseISO(t.updated_at);
    return isWithinInterval(d, { start: lastWeekStart, end: lastWeekEnd });
  }), [myDone, lastWeekStart, lastWeekEnd]);

  const weekChange = doneThisWeek.length - doneLastWeek.length;
  const weekChangePercent = doneLastWeek.length > 0 ? Math.round((weekChange / doneLastWeek.length) * 100) : 0;

  // Daily chart for this week
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = myDone.filter(t => format(parseISO(t.updated_at), "yyyy-MM-dd") === dayStr).length;
      return {
        day: format(day, "EEE", { locale: isRtl ? ar : undefined }),
        completed: count,
      };
    });
  }, [myDone, thisWeekStart, thisWeekEnd, isRtl]);

  // Time tracked
  const totalMinutes = useMemo(() => timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0), [timeEntries]);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    myTasks.forEach(t => { counts[t.status || "backlog"] = (counts[t.status || "backlog"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: t(name as any) || name, value }));
  }, [myTasks, t]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "#f59e0b", "#10b981"];

  // Completion rate
  const completionRate = myTasks.length > 0 ? Math.round((myDone.length / myTasks.length) * 100) : 0;

  // Streak: consecutive days with at least 1 done task (looking backward)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const day = format(new Date(now.getTime() - i * 86400000), "yyyy-MM-dd");
      const hasDone = myDone.some(t => format(parseISO(t.updated_at), "yyyy-MM-dd") === day);
      if (hasDone) count++;
      else if (i > 0) break; // allow today to be empty
    }
    return count;
  }, [myDone]);

  const chartConfig = {
    completed: { label: isRtl ? "مكتملة" : "Completed", color: "hsl(var(--primary))" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isRtl ? "إحصائياتي" : "My Stats"}</h1>
        <p className="text-muted-foreground text-sm">{isRtl ? "تتبع إنتاجيتك وأدائك الشخصي" : "Track your personal productivity and performance"}</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ListChecks, label: isRtl ? "مهامي" : "My Tasks", value: myTasks.length, color: "text-primary" },
          { icon: CheckCircle2, label: isRtl ? "مكتملة" : "Completed", value: myDone.length, color: "text-green-500" },
          { icon: Timer, label: isRtl ? "ساعات العمل" : "Hours Tracked", value: `${totalHours}h`, color: "text-blue-500" },
          { icon: Flame, label: isRtl ? "سلسلة الأيام" : "Day Streak", value: streak, color: "text-orange-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Week comparison + Completion rate */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRtl ? "هذا الأسبوع مقابل السابق" : "This Week vs Last"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="text-3xl font-bold text-foreground">{doneThisWeek.length}</div>
              <Badge variant={weekChange >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
                {weekChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {weekChange >= 0 ? "+" : ""}{weekChange} ({weekChangePercent}%)
              </Badge>
              <div className="text-sm text-muted-foreground">
                {isRtl ? `الأسبوع الماضي: ${doneLastWeek.length}` : `Last week: ${doneLastWeek.length}`}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRtl ? "معدل الإنجاز" : "Completion Rate"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Target className="h-10 w-10 text-primary" />
              <div>
                <div className="text-3xl font-bold text-foreground">{completionRate}%</div>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRtl ? "المهام المتأخرة" : "Overdue Tasks"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Clock className={`h-10 w-10 ${myOverdue.length > 0 ? "text-destructive" : "text-green-500"}`} />
              <div className="text-3xl font-bold text-foreground">{myOverdue.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Chart + Status Distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRtl ? "الإنتاجية هذا الأسبوع" : "This Week's Productivity"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRtl ? "توزيع حالة المهام" : "Task Status Distribution"}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {statusData.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{isRtl ? "لا توجد مهام" : "No tasks"}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      <AchievementsPanel />

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isRtl ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SHORTCUT_LIST.map(s => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs border">{s.key}</kbd>
                <span className="capitalize text-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyStats;
