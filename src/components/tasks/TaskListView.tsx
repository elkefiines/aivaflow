import { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

type Task = Tables<"tasks">;

const priorityBadge: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted/20 text-muted-foreground border-muted/30",
};

const statusBadge: Record<string, string> = {
  backlog: "bg-muted/20 text-muted-foreground border-muted/30",
  todo: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  review: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  memberNames?: Record<string, string>;
}

const TaskListView = ({ tasks, onTaskClick, memberNames = {} }: TaskListViewProps) => {
  const { t } = useLanguage();

  const statusLabels: Record<string, string> = {
    backlog: t("backlog"),
    todo: t("todo"),
    in_progress: t("inProgress"),
    review: t("review"),
    done: t("done"),
  };

  return (
    <div className="rounded-xl border border-border/30 overflow-hidden min-w-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("title")}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("status")}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">{t("priority")}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider hidden md:table-cell">{t("assignee")}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider hidden md:table-cell">{t("dueDate") || "Due Date"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noTasksYet") || "No tasks yet"}</TableCell>
            </TableRow>
          )}
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer border-border/20 hover:bg-primary/5 transition-colors"
              onClick={() => onTaskClick(task)}
            >
              <TableCell>
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-[10px] ${statusBadge[task.status || "backlog"]}`}>
                  {statusLabels[task.status || "backlog"]}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="outline" className={`text-[10px] ${priorityBadge[task.priority || "medium"]}`}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {task.assignee_id ? (memberNames[task.assignee_id] || "Member") : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskListView;
