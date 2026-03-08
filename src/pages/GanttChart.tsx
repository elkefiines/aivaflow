import { useEffect, useState, useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, startOfDay, addDays, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type Task = Tables<"tasks">;

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/80",
  high: "bg-amber-500/80",
  medium: "bg-primary/80",
  low: "bg-muted-foreground/40",
};

const statusColors: Record<string, string> = {
  done: "bg-emerald-500/80",
  in_progress: "bg-amber-500/80",
  review: "bg-purple-500/80",
  todo: "bg-primary/60",
  backlog: "bg-muted-foreground/30",
};

const GanttChart = () => {
  const { projectId } = useActiveProject();
  const { t, lang, dir } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: true })
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  }, [projectId]);

  const { startDate, endDate, totalDays, tasksWithDates } = useMemo(() => {
    const withDates = tasks.filter(t => t.due_date || t.created_at);
    if (withDates.length === 0) return { startDate: new Date(), endDate: addDays(new Date(), 30), totalDays: 30, tasksWithDates: [] };

    const dates = withDates.flatMap(t => {
      const d = [];
      if (t.created_at) d.push(startOfDay(parseISO(t.created_at)));
      if (t.due_date) d.push(startOfDay(parseISO(t.due_date)));
      return d;
    });
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    const total = Math.max(differenceInDays(max, min) + 7, 14);
    const start = addDays(min, -2);
    return { startDate: start, endDate: addDays(start, total), totalDays: total, tasksWithDates: withDates };
  }, [tasks]);

  const dayWidth = 40;
  const rowHeight = 36;

  const headerDays = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Gantt Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === "ar" ? "عرض المهام على خط زمني" : "View tasks on a timeline"}
        </p>
      </div>

      {tasksWithDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{lang === "ar" ? "لا توجد مهام بمواعيد" : "No tasks with dates"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/30 glass">
          <div style={{ minWidth: `${dayWidth * totalDays + 200}px` }}>
            {/* Header */}
            <div className="flex border-b border-border/20 sticky top-0 bg-card/90 backdrop-blur z-10">
              <div className="w-[200px] shrink-0 p-2 text-xs font-medium text-muted-foreground border-e border-border/20">
                {t("tasks")}
              </div>
              <div className="flex">
                {headerDays.map((day, i) => {
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center justify-center border-e border-border/10 ${isToday ? "bg-primary/10" : isWeekend ? "bg-muted/5" : ""}`}
                      style={{ width: dayWidth }}
                    >
                      <span className="text-[8px] text-muted-foreground/60">
                        {format(day, "EEE", { locale: lang === "ar" ? ar : enUS })}
                      </span>
                      <span className={`text-[10px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            {tasksWithDates.map((task, i) => {
              const taskStart = startOfDay(parseISO(task.created_at));
              const taskEnd = task.due_date ? startOfDay(parseISO(task.due_date)) : addDays(taskStart, 3);
              const offset = Math.max(differenceInDays(taskStart, startDate), 0);
              const duration = Math.max(differenceInDays(taskEnd, taskStart), 1);
              const color = statusColors[task.status || "backlog"];

              return (
                <div key={task.id} className="flex border-b border-border/10 hover:bg-card/40 transition-colors" style={{ height: rowHeight }}>
                  <div className="w-[200px] shrink-0 px-2 flex items-center border-e border-border/20">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 me-2 ${priorityColors[task.priority || "medium"]}`} />
                    <span className="text-xs text-foreground truncate">{task.title}</span>
                  </div>
                  <div className="flex-1 relative">
                    {/* Today line */}
                    {(() => {
                      const todayOffset = differenceInDays(startOfDay(new Date()), startDate);
                      if (todayOffset >= 0 && todayOffset < totalDays) {
                        return <div className="absolute top-0 bottom-0 w-px bg-primary/40 z-10" style={{ left: todayOffset * dayWidth + dayWidth / 2 }} />;
                      }
                      return null;
                    })()}
                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full ${color} cursor-pointer hover:opacity-80 transition-opacity`}
                      style={{ left: offset * dayWidth + 4, width: duration * dayWidth - 8 }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      title={`${task.title}\n${format(taskStart, "MMM d")} → ${format(taskEnd, "MMM d")}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
