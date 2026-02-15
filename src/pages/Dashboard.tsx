import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Lightbulb, Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useActiveProject } from "@/hooks/useActiveProject";

type Task = Tables<"tasks">;

const Dashboard = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [ideaCount, setIdeaCount] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      const [tasksRes, membersRes, ideasRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("project_members").select("id", { count: "exact" }).eq("project_id", projectId),
        supabase.from("ideas").select("id", { count: "exact" }).eq("project_id", projectId),
      ]);
      setTasks(tasksRes.data || []);
      setMemberCount((membersRes.count || 0) + 1); // +1 for owner
      setIdeaCount(ideasRes.count || 0);
    };
    load();
  }, [projectId]);

  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;

  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: ListTodo, color: "text-primary" },
    { label: "Completed", value: done, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-amber-400" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ideas", value: ideaCount, icon: Lightbulb, color: "text-purple-400" },
    { label: "Members", value: memberCount, icon: Users, color: "text-sky-400" },
  ];

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const priorityColor: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive",
    high: "bg-amber-500/20 text-amber-400",
    medium: "bg-primary/20 text-primary",
    low: "bg-muted/20 text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your project at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="glass border-border/30">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-base font-display">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Create one from the Tasks page.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/50 border border-border/20">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${priorityColor[task.priority || "medium"]}`}>
                    {task.priority}
                  </div>
                  <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{task.status?.replace("_", " ")}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-base font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Create a new task", desc: "Add a task manually to your board" },
              { label: "Paste an idea", desc: "Drop rough notes and let AI structure them" },
              { label: "Invite a teammate", desc: "Collaborate with your team" },
            ].map(({ label, desc }) => (
              <div key={label} className="p-3 rounded-lg bg-background/50 border border-border/20 hover:border-primary/30 cursor-pointer transition-colors">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
