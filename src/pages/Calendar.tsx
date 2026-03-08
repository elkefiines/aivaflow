import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameDay, isSameMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type Task = Tables<"tasks">;

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/80",
  high: "bg-amber-500/80",
  medium: "bg-primary/80",
  low: "bg-muted-foreground/40",
};

const CalendarView = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { t, lang, dir } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .not("due_date", "is", null)
      .then(({ data }) => {
        setTasks(data || []);
        setLoading(false);
      });
  }, [projectId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const locale = lang === "ar" ? ar : enUS;

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.due_date) {
        const key = format(new Date(task.due_date), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const weekDays = lang === "ar"
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4 sm:space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            {t("calendar") || "Calendar"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("calendarDesc") || "View tasks by due date"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-display font-semibold text-foreground min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy", { locale })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            {t("today") || "Today"}
          </Button>
        </div>
      </div>

      <div className="glass p-4 rounded-xl overflow-x-auto">
        <div className="grid grid-cols-7 gap-px min-w-[600px]">
          {weekDays.map((d) => (
            <div key={d} className="p-2 text-center text-[10px] font-medium text-muted-foreground uppercase">
              {d}
            </div>
          ))}
          {Array(startPad).fill(null).map((_, i) => (
            <div key={`pad-${i}`} className="p-2 min-h-[80px]" />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate[key] || [];
            const today = isToday(day);
            return (
              <div
                key={key}
                className={`p-1.5 min-h-[80px] border border-border/10 rounded-lg transition-colors ${
                  today ? "bg-primary/5 border-primary/30" : "hover:bg-background/50"
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${today ? "text-primary" : "text-foreground/70"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1 px-1 py-0.5 rounded bg-background/60 border border-border/20 cursor-default"
                      title={task.title}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[task.priority || "medium"]}`} />
                      <span className="text-[9px] text-foreground truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] text-muted-foreground ps-1">+{dayTasks.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
