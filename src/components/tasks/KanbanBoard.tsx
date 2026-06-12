import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, User } from "lucide-react";

type Task = Tables<"tasks">;

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: string) => void;
  onTaskClick: (task: Task) => void;
  statuses: string[];
  memberNames?: Record<string, string>;
}

const statusColors: Record<string, string> = {
  backlog: "bg-muted/20 border-muted/30",
  todo: "bg-primary/5 border-primary/20",
  in_progress: "bg-amber-500/5 border-amber-500/20",
  review: "bg-purple-500/5 border-purple-500/20",
  done: "bg-emerald-500/5 border-emerald-500/20",
};

const priorityBadge: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted/20 text-muted-foreground border-muted/30",
};

const priorityBorder: Record<string, string> = {
  critical: "border-s-destructive",
  high: "border-s-amber-400",
  medium: "border-s-primary",
  low: "border-s-muted-foreground/40",
};

const KanbanBoard = ({ tasks, onStatusChange, onTaskClick, statuses, memberNames = {} }: KanbanBoardProps) => {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const statusLabels: Record<string, string> = {
    backlog: t("backlog"),
    todo: t("todo"),
    in_progress: t("inProgress"),
    review: t("review"),
    done: t("done"),
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onStatusChange(taskId, status);
    setDragOver(null);
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== status) setDragOver(status);
  };

  const handleDragLeave = (status: string) => {
    if (dragOver === status) setDragOver(null);
  };

  return (
    <div className="flex gap-4 min-w-[800px] lg:min-w-0 lg:grid lg:grid-cols-5">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const isOver = dragOver === status;
        return (
          <div
            key={status}
            className={`rounded-xl border p-3 min-h-[200px] min-w-[200px] lg:min-w-0 flex-1 lg:flex-none transition-all duration-200 ${
              statusColors[status] || ""
            } ${isOver ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background scale-[1.01]" : ""}`}
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={() => handleDragLeave(status)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {statusLabels[status] || status}
              </h3>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 min-w-5 bg-background/70 border border-border/40 text-muted-foreground"
              >
                {columnTasks.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(task)}
                  className={`p-3 cursor-pointer active:cursor-grabbing bg-card/80 border-border/30 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all border-s-[3px] ${
                    priorityBorder[task.priority || "medium"]
                  } ${draggingId === task.id ? "opacity-50 rotate-1" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityBadge[task.priority || "medium"]}`}>
                          {task.priority}
                        </Badge>
                        {task.assignee_id && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <User className="h-3 w-3" />
                            {memberNames[task.assignee_id] || "Member"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
