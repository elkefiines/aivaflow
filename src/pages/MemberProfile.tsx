import { useEffect, useState, forwardRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";

const MemberProfile = forwardRef<HTMLDivElement>((_, ref) => {
  const { userId } = useParams<{ userId: string }>();
  const { projectId } = useActiveProject();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeMinutes, setTimeMinutes] = useState(0);
  const [role, setRole] = useState<string>("member");

  useEffect(() => {
    if (!userId || !projectId) return;

    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("tasks").select("*").eq("project_id", projectId).eq("assignee_id", userId),
      supabase.from("time_entries").select("duration_minutes").eq("user_id", userId),
      supabase.from("project_members").select("role").eq("project_id", projectId).eq("user_id", userId).single(),
    ]).then(([profileRes, tasksRes, timeRes, memberRes]) => {
      setProfile(profileRes.data);
      setTasks(tasksRes.data || []);
      setTimeMinutes((timeRes.data || []).reduce((sum: number, te: any) => sum + (te.duration_minutes || 0), 0));
      setRole(memberRes.data?.role || "member");
    });
  }, [userId, projectId]);

  if (!profile) return null;

  const totalTasks = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const completionRate = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;
  const hours = Math.round((timeMinutes / 60) * 10) / 10;

  const initials = (profile.display_name || "U")
    .split(/\s/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  return (
    <div ref={ref} className="space-y-6 max-w-2xl mx-auto" dir={dir}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/team")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Button>

      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-display font-bold">{profile.display_name}</h1>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
              <Badge variant="outline" className="mt-2">{role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ListTodo, label: t("totalTasks"), value: totalTasks, color: "text-primary" },
          { icon: CheckCircle2, label: t("completed"), value: done, color: "text-emerald-400" },
          { icon: Clock, label: t("totalHours"), value: `${hours}h`, color: "text-amber-400" },
          { icon: TrendingUp, label: t("completionRate"), value: `${completionRate}%`, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/80">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-lg font-bold font-display">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-medium">{t("completionRate")}</h3>
          <Progress value={completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {done} / {totalTasks} {t("tasksCount")}
          </p>
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">{t("recentTasks")}</h3>
            <div className="space-y-2">
              {tasks.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/20">
                  <span className="text-sm truncate">{task.title}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0 ms-2">
                    {task.status?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
MemberProfile.displayName = "MemberProfile";

export default MemberProfile;
