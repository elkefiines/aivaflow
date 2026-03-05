import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

type Task = Tables<"tasks">;

const statusLabels: Record<string, string> = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress", review: "Review", done: "Done",
};

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
  return (
    <div className="rounded-xl border border-border/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Title</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Priority</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Assignee</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tasks yet</TableCell>
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
              <TableCell>
                <Badge variant="outline" className={`text-[10px] ${priorityBadge[task.priority || "medium"]}`}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {task.assignee_id ? (memberNames[task.assignee_id] || "Member") : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
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
