import { useEffect, useState, useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, PieChart, Pie,
} from "recharts";
import { TrendingUp, Clock, Users, Target } from "lucide-react";

const Analytics = () => {
  const { projectId } = useActiveProject();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [tasks, setTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      supabase.from("tasks").select("*").eq("project_id", projectId),
      supabase.from("time_entries").select("*, tasks!inner(project_id)").eq("tasks.project_id", projectId),
      supabase.from("project_members").select("user_id").eq("project_id", projectId),
    ]).then(async ([tasksRes, timeRes, membersRes]) => {
      setTasks(tasksRes.data || []);
      setTimeEntries(timeRes.data || []);

      const ids = (membersRes.data || []).map((m: any) => m.user_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
        const map: Record<string, string> = {};
        profiles?.forEach((p: any) => { map[p.user_id] = p.display_name || p.user_id.slice(0, 8); });
        setMembers(map);
      }
    });
  }, [projectId]);

  // Velocity: tasks completed per day (last 14 days)
  const velocityData = useMemo(() => {
    const days = 14;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const count = tasks.filter((t) => {
        if (t.status !== "done") return false;
        return new Date(t.updated_at).toDateString() === d.toDateString();
      }).length;
      return {
        day: d.toLocaleDateString(isRtl ? "ar" : "en", { month: "short", day: "numeric" }),
        completed: count,
      };
    });
  }, [tasks, isRtl]);

  // Burndown: remaining tasks over last 30 days
  const burndownData = useMemo(() => {
    const days = 30;
    const now = new Date();
    const totalTasks = tasks.length;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const doneByDate = tasks.filter((t) => {
        if (t.status !== "done") return false;
        return new Date(t.updated_at) <= d;
      }).length;
      return {
        day: d.toLocaleDateString(isRtl ? "ar" : "en", { day: "numeric" }),
        remaining: totalTasks - doneByDate,
      };
    });
  }, [tasks, isRtl]);

  // Time by member
  const timeByMember = useMemo(() => {
    const map: Record<string, number> = {};
    timeEntries.forEach((te: any) => {
      const mins = te.duration_minutes || 0;
      map[te.user_id] = (map[te.user_id] || 0) + mins;
    });
    return Object.entries(map).map(([uid, mins]) => ({
      name: members[uid] || uid.slice(0, 8),
      hours: Math.round((mins / 60) * 10) / 10,
    }));
  }, [timeEntries, members]);

  // Priority distribution
  const priorityDist = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    tasks.forEach((t) => { if (t.priority) counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: t(name as any), value }));
  }, [tasks, t]);

  const priorityColors = ["hsl(var(--muted-foreground))", "hsl(var(--primary))", "hsl(45, 90%, 55%)", "hsl(0, 70%, 55%)"];

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const totalHours = Math.round(timeEntries.reduce((sum: number, te: any) => sum + (te.duration_minutes || 0), 0) / 60 * 10) / 10;

  return (
    <div className="space-y-4 sm:space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("analytics")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("analyticsDesc")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Target, label: t("totalTasks"), value: total, color: "text-primary" },
          { icon: TrendingUp, label: t("completed"), value: done, color: "text-emerald-400" },
          { icon: Clock, label: t("totalHours"), value: `${totalHours}h`, color: "text-amber-400" },
          { icon: Users, label: t("members"), value: Object.keys(members).length, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold font-display">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="velocity">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="velocity">{t("velocity")}</TabsTrigger>
          <TabsTrigger value="burndown">{t("burndown")}</TabsTrigger>
          <TabsTrigger value="time">{t("timeDistribution")}</TabsTrigger>
          <TabsTrigger value="priority">{t("priorityDist")}</TabsTrigger>
        </TabsList>

        <TabsContent value="velocity">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t("velocityChart")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="burndown">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display">{t("burndownChart")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={burndownData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                    <Tooltip />
                    <Area type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                {t("timeByMember")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {timeByMember.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center pt-12">{t("noTimeEntries")}</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeByMember} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(45, 90%, 55%)" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display">{t("priorityDist")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {priorityDist.map((_, i) => (
                        <Cell key={i} fill={priorityColors[i]} fillOpacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
