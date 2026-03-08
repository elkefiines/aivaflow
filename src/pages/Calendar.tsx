import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import TaskEditDialog from "@/components/tasks/TaskEditDialog";
import { Skeleton } from "@/components/ui/skeleton";

type Task = Tables<"tasks">;

const priorityDots: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-amber-500",
  medium: "bg-primary",
  low: "bg-muted-foreground/50",
};

const statusBg: Record<string, string> = {
  done: "bg-emerald-500/10 border-emerald-500/20",
  in_progress: "bg-amber-500/10 border-amber-500/20",
  review: "bg-purple-500/10 border-purple-500/20",
  todo: "bg-primary/5 border-primary/20",
  backlog: "bg-muted/10 border-muted/20",
};

const CalendarView = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { t, lang, dir } = useLanguage();
  const isAr = lang === "ar";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadTasks = () => {
    if (!projectId) return;
    setLoading(true);
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .then(({ data }) => {
        setTasks(data || []);
        setLoading(false);
      });
  };

  useEffect(() => { loadTasks(); }, [projectId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const locale = isAr ? ar : enUS;

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      // Show on due_date
      if (task.due_date) {
        const key = format(new Date(task.due_date), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
      // Also show start_date if different
      const sd = (task as any).start_date;
      if (sd) {
        const key = format(new Date(sd), "yyyy-MM-dd");
        const dueKey = task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : null;
        if (key !== dueKey) {
          if (!map[key]) map[key] = [];
          map[key].push(task);
        }
      }
    });
    return map;
  }, [tasks]);

  const weekDays = isAr
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleTaskClick = (task: Task) => {
    setEditTask(task);
    setEditOpen(true);
  };

  const todayCount = useMemo(() => {
    const key = format(new Date(), "yyyy-MM-dd");
    return (tasksByDate[key] || []).length;
  }, [tasksByDate]);

  return (
    <div className="space-y-4 sm:space-y-6" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            {t("calendar") || "Calendar"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? "عرض المهام حسب التاريخ — اضغط على المهمة لتعديلها" : "View tasks by date — click a task to edit"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-display font-semibold text-foreground min-w-[160px] text-center">
            {format(currentDate, "MMMM yyyy", { locale })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            {t("today") || "Today"}
            {todayCount > 0 && (
              <Badge variant="secondary" className="ms-1.5 h-4 text-[10px] px-1">{todayCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="glass p-3 sm:p-4 rounded-xl overflow-x-auto">
          <div className="grid grid-cols-7 gap-px min-w-[650px]">
            {weekDays.map((d) => (
              <div key={d} className="p-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
            {Array(startPad).fill(null).map((_, i) => (
              <div key={`pad-${i}`} className="p-1.5 min-h-[90px] rounded-lg" />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate[key] || [];
              const today = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={key}
                  className={`p-1.5 min-h-[90px] border border-border/10 rounded-lg transition-all ${
                    today ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : isWeekend ? "bg-muted/5" : "hover:bg-background/50"
                  }`}
                >
                  <div className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${today ? "text-primary" : "text-foreground/60"}`}>
                    {today && <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">{format(day, "d")}</div>}
                    {!today && <span>{format(day, "d")}</span>}
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] text-muted-foreground ms-auto">{dayTasks.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => {
                      const isDue = task.due_date && format(new Date(task.due_date), "yyyy-MM-dd") === key;
                      const isStart = (task as any).start_date && format(new Date((task as any).start_date), "yyyy-MM-dd") === key;
                      return (
                        <div
                          key={task.id + key}
                          onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-pointer 
                            transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]
                            ${statusBg[task.status || "backlog"]}`}
                          title={`${task.title}${isDue ? " (Due)" : ""}${isStart ? " (Start)" : ""}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDots[task.priority || "medium"]}`} />
                          <span className={`text-[9px] truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </span>
                          {isStart && !isDue && <span className="text-[7px] text-muted-foreground shrink-0">▸</span>}
                          {isDue && <span className="text-[7px] text-muted-foreground shrink-0">◆</span>}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-muted-foreground ps-1 font-medium">+{dayTasks.length - 3} {isAr ? "أخرى" : "more"}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-4 pt-3 border-t border-border/20">
            <div className="flex items-center gap-1"><span className="text-[9px]">▸</span><span className="text-[10px] text-muted-foreground">{isAr ? "تاريخ البدء" : "Start date"}</span></div>
            <div className="flex items-center gap-1"><span className="text-[9px]">◆</span><span className="text-[10px] text-muted-foreground">{isAr ? "تاريخ الاستحقاق" : "Due date"}</span></div>
            {Object.entries(priorityDots).map(([p, color]) => (
              <div key={p} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[10px] text-muted-foreground capitalize">{p}</span>
              </div>
            ))}
          </div>
        </div>
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

export default CalendarView;
