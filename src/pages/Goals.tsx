import { useEffect, useState } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Trash2, Link2, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";

interface Goal {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: string;
  created_at: string;
}

interface GoalTask {
  goal_id: string;
  task_id: string;
}

const Goals = () => {
  const { projectId } = useActiveProject();
  const { user } = useAuth();
  const { t, lang, dir } = useLanguage();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [goalTasks, setGoalTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(false);
    try {
      const [goalsRes, tasksRes, goalTasksRes] = await Promise.all([
        supabase.from("goals").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
        supabase.from("tasks").select("id, title, status").eq("project_id", projectId),
        supabase.rpc("is_project_member", { _project_id: projectId, _user_id: user?.id || "" }).then(() =>
          supabase.from("goal_tasks").select("*")
        ),
      ]);
      if (goalsRes.error) throw goalsRes.error;
      setGoals((goalsRes.data as Goal[]) || []);
      setTasks(tasksRes.data || []);
      setGoalTasks((goalTasksRes.data as GoalTask[]) || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  // Compute progress for each goal based on linked tasks
  const getGoalProgress = (goalId: string) => {
    const linkedTaskIds = goalTasks.filter(gt => gt.goal_id === goalId).map(gt => gt.task_id);
    if (linkedTaskIds.length === 0) return 0;
    const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
    const done = linkedTasks.filter(t => t.status === "done").length;
    return Math.round((done / linkedTasks.length) * 100);
  };

  const createGoal = async () => {
    if (!user || !projectId || !title.trim()) return;
    const { error } = await supabase.from("goals").insert({
      project_id: projectId,
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
      target_date: targetDate || null,
    } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success(lang === "ar" ? "تم إنشاء الهدف" : "Goal created");
    setTitle(""); setDescription(""); setTargetDate("");
    setDialogOpen(false);
    load();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    load();
  };

  const linkTask = async (goalId: string, taskId: string) => {
    await supabase.from("goal_tasks").insert({ goal_id: goalId, task_id: taskId } as any);
    load();
  };

  const unlinkTask = async (goalId: string, taskId: string) => {
    await supabase.from("goal_tasks").delete().match({ goal_id: goalId, task_id: taskId });
    load();
  };

  const getLinkedTasks = (goalId: string) => {
    const ids = goalTasks.filter(gt => gt.goal_id === goalId).map(gt => gt.task_id);
    return tasks.filter(t => ids.includes(t.id));
  };

  const getUnlinkedTasks = (goalId: string) => {
    const ids = goalTasks.filter(gt => gt.goal_id === goalId).map(gt => gt.task_id);
    return tasks.filter(t => !ids.includes(t.id));
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {lang === "ar" ? "الأهداف" : "Goals & OKRs"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lang === "ar" ? "ربط المهام بأهداف استراتيجية وتتبع التقدم" : "Link tasks to strategic goals and track progress"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 me-1" /> {lang === "ar" ? "هدف جديد" : "New Goal"}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{lang === "ar" ? "إنشاء هدف" : "Create Goal"}</DialogTitle>
              <DialogDescription>{lang === "ar" ? "حدد هدفاً استراتيجياً واربطه بالمهام" : "Define a strategic goal and link tasks to it"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t("title")}</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={lang === "ar" ? "مثال: إطلاق النسخة 2.0" : "e.g. Launch v2.0"} />
              </div>
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "التاريخ المستهدف" : "Target Date"}</Label>
                <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
              </div>
              <Button onClick={createGoal} disabled={!title.trim()} className="w-full">
                {lang === "ar" ? "إنشاء" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={lang === "ar" ? "لا توجد أهداف بعد" : "No goals yet"}
          description={lang === "ar" ? "أنشئ هدفاً استراتيجياً واربطه بالمهام" : "Create a strategic goal and link tasks to it"}
          actionLabel={lang === "ar" ? "هدف جديد" : "New Goal"}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal, i) => {
            const progress = getGoalProgress(goal.id);
            const linked = getLinkedTasks(goal.id);
            const isLinking = linkingGoalId === goal.id;
            const unlinked = isLinking ? getUnlinkedTasks(goal.id) : [];

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass p-4 rounded-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-medium text-foreground">{goal.title}</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {goal.description && <p className="text-xs text-muted-foreground mb-3">{goal.description}</p>}
                
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{lang === "ar" ? "التقدم" : "Progress"}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Linked tasks */}
                <div className="space-y-1 mb-2">
                  {linked.map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-background/50">
                      <CheckCircle2 className={`h-3 w-3 shrink-0 ${task.status === "done" ? "text-emerald-400" : "text-muted-foreground/40"}`} />
                      <span className="flex-1 truncate text-foreground">{task.title}</span>
                      <button onClick={() => unlinkTask(goal.id, task.id)}>
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Link task button */}
                {!isLinking ? (
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => setLinkingGoalId(goal.id)}>
                    <Link2 className="h-3 w-3 me-1" /> {lang === "ar" ? "ربط مهمة" : "Link Task"}
                  </Button>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-border/20 rounded-lg p-2">
                    <button onClick={() => setLinkingGoalId(null)} className="text-[10px] text-muted-foreground hover:text-foreground mb-1">
                      {lang === "ar" ? "إغلاق" : "Close"} ✕
                    </button>
                    {unlinked.length === 0 && <p className="text-[10px] text-muted-foreground text-center">{lang === "ar" ? "كل المهام مربوطة" : "All tasks linked"}</p>}
                    {unlinked.map(task => (
                      <button
                        key={task.id}
                        onClick={() => linkTask(goal.id, task.id)}
                        className="w-full text-start text-xs p-1.5 rounded hover:bg-accent/50 truncate text-foreground"
                      >
                        + {task.title}
                      </button>
                    ))}
                  </div>
                )}

                {goal.target_date && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    🎯 {lang === "ar" ? "الهدف:" : "Target:"} {new Date(goal.target_date).toLocaleDateString(lang === "ar" ? "ar" : "en")}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Goals;
