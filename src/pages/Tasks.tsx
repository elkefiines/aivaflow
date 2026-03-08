import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, LayoutGrid, List } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import TaskListView from "@/components/tasks/TaskListView";
import TaskEditDialog from "@/components/tasks/TaskEditDialog";

type Task = Tables<"tasks">;

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const Tasks = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { t, dir } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [status, setStatus] = useState<string>("todo");
  const [loading, setLoading] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  const loadTasks = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });
    setTasks(data || []);
  };

  const loadMembers = async () => {
    if (!projectId) return;
    const { data: proj } = await supabase.from("projects").select("owner_id").eq("id", projectId).single();
    const { data: pm } = await supabase.from("project_members").select("user_id").eq("project_id", projectId);
    const ids = new Set<string>();
    if (proj?.owner_id) ids.add(proj.owner_id);
    pm?.forEach((m) => ids.add(m.user_id));
    if (ids.size === 0) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", Array.from(ids));
    const map: Record<string, string> = {};
    profiles?.forEach((p) => { map[p.user_id] = p.display_name || p.user_id.slice(0, 8); });
    setMemberNames(map);
  };

  useEffect(() => {
    loadTasks();
    loadMembers();

    if (!projectId) return;
    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, () => {
        loadTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const createTask = async () => {
    if (!user || !projectId || !title.trim()) return;
    setLoading(true);
    const newTask: TablesInsert<"tasks"> = {
      title: title.trim(),
      description: description.trim() || null,
      priority: priority as Task["priority"],
      status: status as Task["status"],
      project_id: projectId,
      created_by: user.id,
      assignee_id: assigneeId === "unassigned" ? null : assigneeId,
      position: tasks.length,
    };
    const { error } = await supabase.from("tasks").insert(newTask);
    setLoading(false);
    if (error) { toast.error("Failed to create task"); return; }
    toast.success("Task created");
    setTitle(""); setDescription(""); setPriority("medium"); setStatus("todo"); setAssigneeId("unassigned");
    setDialogOpen(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus as Task["status"] }).eq("id", taskId);
  };

  const handleTaskClick = (task: Task) => {
    setEditTask(task);
    setEditOpen(true);
  };

  const priorityLabels: Record<string, string> = {
    low: t("low"),
    medium: t("medium"),
    high: t("high"),
    critical: t("critical"),
  };

  const statusLabels: Record<string, string> = {
    backlog: t("backlog"),
    todo: t("todo"),
    in_progress: t("inProgress"),
    review: t("review"),
    done: t("done"),
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("tasks")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{tasks.length} {t("tasksInProject")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border/30 p-0.5">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />{t("newTask")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir={dir}>
              <DialogHeader>
                <DialogTitle className="font-display">{t("createTask")}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">{t("addTaskToProject")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{t("title")}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("taskTitle")} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label>{t("description")}</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("optionalDetails")} rows={3} className="bg-background/50 border-border/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("priority")}</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("status")}</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("assignee")}</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger><SelectValue placeholder={t("unassigned")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t("unassigned")}</SelectItem>
                      {Object.entries(memberNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTask} disabled={loading || !title.trim()} className="w-full">
                  {loading ? t("creating") : t("createTask")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={updateTaskStatus}
          onTaskClick={handleTaskClick}
          statuses={STATUSES as unknown as string[]}
          memberNames={memberNames}
        />
      ) : (
        <TaskListView tasks={tasks} onTaskClick={handleTaskClick} memberNames={memberNames} />
      )}

      {projectId && (
        <TaskEditDialog
          task={editTask}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={loadTasks}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default Tasks;