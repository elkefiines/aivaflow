import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock } from "lucide-react";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  note: string | null;
}

interface Props {
  taskId: string;
}

const TaskTimer = ({ taskId }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const load = async () => {
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .eq("task_id", taskId)
      .eq("user_id", user?.id || "");

    const entries = (data as TimeEntry[]) || [];
    const active = entries.find((e) => !e.ended_at);
    setActiveEntry(active || null);
    const completed = entries.filter((e) => e.ended_at && e.duration_minutes);
    setTotalMinutes(completed.reduce((sum, e) => sum + (e.duration_minutes || 0), 0));
  };

  useEffect(() => {
    if (taskId && user) load();
  }, [taskId, user]);

  useEffect(() => {
    if (!activeEntry) { setElapsed(0); return; }
    const started = new Date(activeEntry.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const startTimer = async () => {
    if (!user) return;
    const { error } = await supabase.from("time_entries").insert({
      task_id: taskId,
      user_id: user.id,
      started_at: new Date().toISOString(),
    } as any);
    if (error) { toast.error("Failed to start timer"); return; }
    load();
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    const started = new Date(activeEntry.started_at).getTime();
    const duration = Math.round((Date.now() - started) / 60000);
    const { error } = await supabase
      .from("time_entries")
      .update({ ended_at: new Date().toISOString(), duration_minutes: Math.max(duration, 1) } as any)
      .eq("id", activeEntry.id);
    if (error) { toast.error("Failed to stop timer"); return; }
    setActiveEntry(null);
    load();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      {totalMinutes > 0 && (
        <span className="text-[10px] text-muted-foreground">{formatMinutes(totalMinutes)}</span>
      )}
      {activeEntry ? (
        <>
          <span className="text-xs font-mono text-primary animate-pulse">{formatTime(elapsed)}</span>
          <Button variant="destructive" size="icon" className="h-6 w-6" onClick={stopTimer}>
            <Square className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startTimer} title={t("startTimer") || "Start Timer"}>
          <Play className="h-3 w-3 text-primary" />
        </Button>
      )}
    </div>
  );
};

export default TaskTimer;
