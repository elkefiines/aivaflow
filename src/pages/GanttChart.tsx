import { useEffect, useState, useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, startOfDay, addDays, parseISO, subDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import TaskEditDialog from "@/components/tasks/TaskEditDialog";

type Task = Tables<"tasks">;

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/80 border-destructive/60",
  high: "bg-amber-500/70 border-amber-500/50",
  medium: "bg-primary/70 border-primary/50",
  low: "bg-muted-foreground/30 border-muted-foreground/20",
};

const statusColors: Record<string, string> = {
  done: "bg-emerald-500/80",
  in_progress: "bg-amber-500/70",
  review: "bg-purple-500/70",
  todo: "bg-primary/60",
  backlog: "bg-muted-foreground/30",
};

const statusLabels: Record<string, string> = {
  done: "✓",
  in_progress: "▶",
  review: "◎",
  todo: "○",
  backlog: "·",
};

const GanttChart = () => {
  const { projectId } = useActiveProject();
  const { t, lang, dir } = useLanguage();
  const isAr = lang === "ar";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayWidth, setDayWidth] = useState(44);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadTasks = () => {
    if (!projectId) return;
    supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: true })
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  };

  useEffect(() => { loadTasks(); }, [projectId]);

  const { startDate, totalDays, tasksWithDates } = useMemo(() => {
    const withDates = tasks.filter(t => t.due_date || (t as any).start_date || t.created_at);
    if (withDates.length === 0) return { startDate: subDays(new Date(), 3), totalDays: 30, tasksWithDates: [] };

    const dates = withDates.flatMap(t => {
      const d = [];
      if ((t as any).start_date) d.push(startOfDay(parseISO((t as any).start_date)));
      if (t.created_at) d.push(startOfDay(parseISO(t.created_at)));
      if (t.due_date) d.push(startOfDay(parseISO(t.due_date)));
      return d;
    });
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    const total = Math.max(differenceInDays(max, min) + 10, 21);
    const start = addDays(min, -3);
    return { startDate: start, totalDays: total, tasksWithDates: withDates };
  }, [tasks]);

  const rowHeight = 40;
  const headerDays = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));

  // Group by month for header
  const months = useMemo(() => {
    const m: { label: string; span: number }[] = [];
    let cur = "";
    headerDays.forEach(day => {
      const label = format(day, "MMM yyyy", { locale: isAr ? ar : enUS });
      if (label !== cur) {
        m.push({ label, span: 1 });
        cur = label;
      } else {
        m[m.length - 1].span++;
      }
    });
    return m;
  }, [headerDays, isAr]);

  const handleTaskClick = (task: Task) => {
    setEditTask(task);
    setEditOpen(true);
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {isAr ? "مخطط جانت" : "Gantt Chart"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? "عرض المهام على خط زمني تفاعلي" : "Interactive timeline view of tasks"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayWidth(w => Math.max(24, w - 8))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayWidth(w => Math.min(80, w + 8))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {tasksWithDates.length === 0 ? (
        <div className="text-center py-16 glass rounded-xl">
          <p className="text-muted-foreground">{isAr ? "لا توجد مهام بمواعيد" : "No tasks with dates"}</p>
          <p className="text-muted-foreground/60 text-xs mt-1">{isAr ? "أضف تاريخ بدء أو استحقاق لمهامك" : "Add start or due dates to your tasks"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/30 glass">
          <div style={{ minWidth: `${dayWidth * totalDays + 220}px` }}>
            {/* Month header */}
            <div className="flex border-b border-border/20 bg-card/95 backdrop-blur">
              <div className="w-[220px] shrink-0" />
              <div className="flex">
                {months.map((m, i) => (
                  <div key={i} className="text-[10px] font-semibold text-foreground/70 px-2 py-1 border-e border-border/10" style={{ width: m.span * dayWidth }}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Day header */}
            <div className="flex border-b border-border/30 sticky top-0 bg-card/95 backdrop-blur z-10">
              <div className="w-[220px] shrink-0 p-2 text-xs font-medium text-muted-foreground border-e border-border/20">
                {t("tasks")}
              </div>
              <div className="flex">
                {headerDays.map((day, i) => {
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center justify-center border-e border-border/10 py-1 ${isToday ? "bg-primary/15" : isWeekend ? "bg-muted/10" : ""}`}
                      style={{ width: dayWidth }}
                    >
                      <span className="text-[7px] text-muted-foreground/50 uppercase">
                        {format(day, "EEE", { locale: isAr ? ar : enUS })}
                      </span>
                      <span className={`text-[10px] font-medium ${isToday ? "text-primary font-bold bg-primary/20 rounded-full w-5 h-5 flex items-center justify-center" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task rows */}
            {tasksWithDates.map((task, i) => {
              const taskStart = (task as any).start_date
                ? startOfDay(parseISO((task as any).start_date))
                : startOfDay(parseISO(task.created_at));
              const taskEnd = task.due_date ? startOfDay(parseISO(task.due_date)) : addDays(taskStart, 2);
              const offset = Math.max(differenceInDays(taskStart, startDate), 0);
              const duration = Math.max(differenceInDays(taskEnd, taskStart), 1);
              const barColor = statusColors[task.status || "backlog"];
              const isDone = task.status === "done";

              return (
                <div
                  key={task.id}
                  className="flex border-b border-border/10 hover:bg-card/60 transition-colors group cursor-pointer"
                  style={{ height: rowHeight }}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="w-[220px] shrink-0 px-3 flex items-center gap-2 border-e border-border/20 overflow-hidden">
                    <span className="text-[10px] shrink-0">{statusLabels[task.status || "backlog"]}</span>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[task.priority || "medium"].split(" ")[0]}`} />
                    <span className={`text-xs truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    {/* Weekend shading */}
                    {headerDays.map((day, di) => {
                      if (day.getDay() === 0 || day.getDay() === 6) {
                        return <div key={di} className="absolute top-0 bottom-0 bg-muted/5" style={{ left: di * dayWidth, width: dayWidth }} />;
                      }
                      return null;
                    })}
                    {/* Today line */}
                    {(() => {
                      const todayOffset = differenceInDays(startOfDay(new Date()), startDate);
                      if (todayOffset >= 0 && todayOffset < totalDays) {
                        return <div className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10" style={{ left: todayOffset * dayWidth + dayWidth / 2 }} />;
                      }
                      return null;
                    })()}
                    {/* Task bar */}
                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${barColor} border border-white/10 
                        flex items-center px-1.5 overflow-hidden hover:brightness-110 transition-all shadow-sm`}
                      style={{ left: offset * dayWidth + 2, width: Math.max(duration * dayWidth - 4, dayWidth - 4) }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.3, ease: "easeOut" }}
                    >
                      {duration * dayWidth > 60 && (
                        <span className="text-[9px] text-white/90 font-medium truncate">{task.title}</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-2 rounded-sm ${color}`} />
            <span className="text-[10px] text-muted-foreground capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>

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

export default GanttChart;
