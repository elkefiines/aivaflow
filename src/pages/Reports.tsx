import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FileBarChart, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Heart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Report = Tables<"reports">;

interface ReportContent {
  title: string;
  summary: string;
  highlights: string[];
  risks: string[];
  recommendations: string[];
  health_score: number;
  tasks_by_status?: Record<string, number>;
  tasks_by_priority?: Record<string, number>;
  overdue_count?: number;
}

const statusColors: Record<string, string> = {
  backlog: "hsl(228, 20%, 50%)",
  todo: "hsl(233, 90%, 47%)",
  in_progress: "hsl(45, 90%, 55%)",
  review: "hsl(280, 60%, 55%)",
  done: "hsl(145, 60%, 45%)",
};

const Reports = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState<{ status: string | null; updated_at: string }[]>([]);

  const loadReports = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10);
    setReports(data || []);
  };

  const loadTasks = async () => {
    if (!projectId) return;
    const { data } = await supabase.from("tasks").select("status, updated_at").eq("project_id", projectId);
    setTasks(data || []);
  };

  useEffect(() => { loadReports(); loadTasks(); }, [projectId]);

  const generateReport = async (type: "daily" | "weekly") => {
    if (!projectId) return;
    setGenerating(true);
    const { error } = await supabase.functions.invoke("generate-report", {
      body: { project_id: projectId, type },
    });
    setGenerating(false);
    if (error) { toast.error("Failed to generate report"); return; }
    toast.success("Report generated!");
    loadReports();
  };

  // Velocity chart: tasks completed per day (last 14 days)
  const velocityData = (() => {
    const days = 14;
    const result: { day: string; completed: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayStr = d.toLocaleDateString("en", { month: "short", day: "numeric" });
      const count = tasks.filter(t => {
        if (t.status !== "done") return false;
        const updated = new Date(t.updated_at);
        return updated.toDateString() === d.toDateString();
      }).length;
      result.push({ day: dayStr, completed: count });
    }
    return result;
  })();

  const healthColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-generated progress summaries & analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => generateReport("daily")} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Daily Report
          </Button>
          <Button size="sm" onClick={() => generateReport("weekly")} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Weekly Report
          </Button>
        </div>
      </div>

      {/* Velocity Chart */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Task Velocity (14 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <XAxis dataKey="day" tick={{ fill: "hsl(228, 20%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(228, 20%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(230, 50%, 9%)", border: "1px solid hsl(233, 50%, 23%)", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "hsl(228, 33%, 95%)" }}
                />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {velocityData.map((_, i) => (
                    <Cell key={i} fill="hsl(233, 90%, 47%)" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <div className="space-y-4">
        {reports.length === 0 && (
          <div className="text-center py-12">
            <FileBarChart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No reports yet. Generate one above.</p>
          </div>
        )}

        {reports.map((report) => {
          const content = report.content as unknown as ReportContent;
          if (!content) return null;

          const statusData = Object.entries(content.tasks_by_status || {}).map(([name, value]) => ({
            name: name.replace("_", " "),
            value,
            fill: statusColors[name] || "hsl(228, 20%, 50%)",
          }));

          return (
            <Card key={report.id} className="border-border/40 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-display">{content.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(report.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{report.type}</Badge>
                    <div className={`flex items-center gap-1 text-sm font-bold ${healthColor(content.health_score)}`}>
                      <Heart className="h-4 w-4" />
                      {content.health_score}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground/80">{content.summary}</p>

                {statusData.length > 0 && (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData} layout="vertical">
                        <XAxis type="number" tick={{ fill: "hsl(228, 20%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "hsl(228, 20%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {statusData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {content.highlights?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Highlights</p>
                    <ul className="space-y-1">
                      {content.highlights.map((h, i) => <li key={i} className="text-sm text-foreground/80 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-400/60">{h}</li>)}
                    </ul>
                  </div>
                )}

                {content.risks?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-400" /> Risks</p>
                    <ul className="space-y-1">
                      {content.risks.map((r, i) => <li key={i} className="text-sm text-foreground/80 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber-400/60">{r}</li>)}
                    </ul>
                  </div>
                )}

                {content.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Recommendations</p>
                    <ul className="space-y-1">
                      {content.recommendations.map((r, i) => <li key={i} className="text-sm text-foreground/80 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary/60">{r}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
