import { useState, useEffect } from "react";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import TaskComments from "@/components/tasks/TaskComments";
import TaskTimer from "@/components/tasks/TaskTimer";

type Task = Tables<"tasks">;

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

interface Member {
  user_id: string;
  display_name: string | null;
}

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  projectId: string;
}

const TaskEditDialog = ({ task, open, onOpenChange, onSaved, projectId }: TaskEditDialogProps) => {
  const { t, dir } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const priorityLabels: Record<string, string> = {
    low: t("low"), medium: t("medium"), high: t("high"), critical: t("critical"),
  };

  const statusLabels: Record<string, string> = {
    backlog: t("backlog"), todo: t("todo"), in_progress: t("inProgress"), review: t("review"), done: t("done"),
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || "todo");
      setAssigneeId(task.assignee_id || "unassigned");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    }
  }, [task]);

  useEffect(() => {
    if (!projectId || !open) return;
    const loadMembers = async () => {
      const { data: proj } = await supabase.from("projects").select("owner_id").eq("id", projectId).single();
      const { data: pm } = await supabase.from("project_members").select("user_id").eq("project_id", projectId);
      const userIds = new Set<string>();
      if (proj?.owner_id) userIds.add(proj.owner_id);
      pm?.forEach((m) => userIds.add(m.user_id));
      if (userIds.size === 0) { setMembers([]); return; }
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", Array.from(userIds));
      setMembers(profiles || []);
    };
    loadMembers();
  }, [projectId, open]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    setLoading(true);
    const updates: TablesUpdate<"tasks"> = {
      title: title.trim(),
      description: description.trim() || null,
      priority: priority as Task["priority"],
      status: status as Task["status"],
      assignee_id: assigneeId === "unassigned" ? null : assigneeId,
      due_date: dueDate || null,
    };
    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    setLoading(false);
    if (error) { toast.error(t("failedToUpdateTask") || "Failed to update task"); return; }
    toast.success(t("taskUpdated") || "Task updated");
    onSaved();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) { toast.error(t("failedToDeleteTask") || "Failed to delete task"); return; }
    toast.success(t("taskDeleted") || "Task deleted");
    onSaved();
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="font-display">{t("editTask") || "Edit Task"}</DialogTitle>
          <div className="flex items-center justify-between">
            <DialogDescription className="text-muted-foreground text-sm">{t("updateTaskDetails") || "Update task details, assign members, and set due dates."}</DialogDescription>
            <TaskTimer taskId={task.id} />
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>{t("description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-background/50 border-border/50 resize-none" />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("assignee")}</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder={t("unassigned")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t("unassigned")}</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.display_name || m.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("dueDate") || "Due Date"}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-background/50 border-border/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading || !title.trim()} className="flex-1">
              {loading ? t("saving") || "Saving…" : t("saveChanges") || "Save Changes"}
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete} title={t("deleteTask") || "Delete task"}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="border-t border-border/30 pt-3">
            <TaskComments taskId={task.id} memberNames={Object.fromEntries(members.map(m => [m.user_id, m.display_name || m.user_id.slice(0, 8)]))} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditDialog;