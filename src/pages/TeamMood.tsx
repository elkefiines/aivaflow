import { useEffect, useState } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Meh, Frown, Heart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface MoodLog {
  id: string;
  project_id: string;
  user_id: string;
  mood: string;
  note: string | null;
  logged_date: string;
}

const MOODS = [
  { value: "happy", icon: Smile, color: "text-emerald-400", bg: "bg-emerald-500/20", en: "Happy", ar: "سعيد" },
  { value: "neutral", icon: Meh, color: "text-amber-400", bg: "bg-amber-500/20", en: "Neutral", ar: "عادي" },
  { value: "stressed", icon: Frown, color: "text-red-400", bg: "bg-red-500/20", en: "Stressed", ar: "مرهق" },
];

const TeamMood = () => {
  const { projectId } = useActiveProject();
  const { user } = useAuth();
  const { lang, dir } = useLanguage();
  const isAr = lang === "ar";
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    if (!projectId) return;
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const [logsRes, membersRes] = await Promise.all([
      supabase.from("mood_logs").select("*").eq("project_id", projectId).gte("logged_date", weekAgo).order("logged_date", { ascending: false }),
      supabase.from("project_members").select("user_id").eq("project_id", projectId),
    ]);
    const userIds = (membersRes.data || []).map(m => m.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const names: Record<string, string> = {};
      (profiles || []).forEach(p => { names[p.user_id] = p.display_name || "Unknown"; });
      setMemberNames(names);
    }
    const allLogs = (logsRes.data as MoodLog[]) || [];
    setLogs(allLogs);
    const myToday = allLogs.find(l => l.user_id === user?.id && l.logged_date === today);
    if (myToday) setTodayMood(myToday.mood);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const logMood = async (mood: string) => {
    if (!user || !projectId) return;
    const existing = logs.find(l => l.user_id === user.id && l.logged_date === today);
    if (existing) {
      await supabase.from("mood_logs").update({ mood, note: note.trim() || null } as any).eq("id", existing.id);
    } else {
      await supabase.from("mood_logs").insert({
        project_id: projectId,
        user_id: user.id,
        mood,
        note: note.trim() || null,
        logged_date: today,
      } as any);
    }
    setTodayMood(mood);
    toast.success(isAr ? "تم تسجيل حالتك" : "Mood logged");
    load();
  };

  // Weekly summary per day
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
  const daySummary = last7.map(date => {
    const dayLogs = logs.filter(l => l.logged_date === date);
    const counts = { happy: 0, neutral: 0, stressed: 0 };
    dayLogs.forEach(l => { if (l.mood in counts) counts[l.mood as keyof typeof counts]++; });
    return { date, ...counts, total: dayLogs.length };
  });

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          <Heart className="h-5 w-5 inline-block me-2 text-primary" />
          {isAr ? "مزاج الفريق" : "Team Mood"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr ? "سجل حالتك اليومية وتابع صحة الفريق" : "Log your daily mood and track team wellness"}
        </p>
      </div>

      {/* Today's mood */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-sm font-medium text-foreground mb-4">
          {isAr ? "كيف حالك اليوم؟" : "How are you feeling today?"}
        </h3>
        <div className="flex gap-4 mb-4">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => logMood(m.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${todayMood === m.value ? `${m.bg} border-current ${m.color}` : "border-border/20 hover:border-border/40"}`}
            >
              <m.icon className={`h-8 w-8 ${todayMood === m.value ? m.color : "text-muted-foreground"}`} />
              <span className="text-xs">{isAr ? m.ar : m.en}</span>
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={isAr ? "ملاحظة اختيارية..." : "Optional note..."}
          rows={1}
          className="resize-none text-xs bg-background/50"
        />
      </div>

      {/* Weekly chart */}
      <div className="glass p-4 rounded-xl">
        <h3 className="text-sm font-medium text-foreground mb-4">
          {isAr ? "مخطط الأسبوع" : "Weekly Overview"}
        </h3>
        <div className="flex gap-2">
          {daySummary.map(day => {
            const maxH = 60;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex flex-col-reverse gap-0.5" style={{ height: maxH }}>
                  {day.total === 0 ? (
                    <div className="w-full h-2 bg-muted/20 rounded" />
                  ) : (
                    <>
                      {day.happy > 0 && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${(day.happy / day.total) * maxH}px` }}
                          className="w-full bg-emerald-500/60 rounded-t"
                        />
                      )}
                      {day.neutral > 0 && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${(day.neutral / day.total) * maxH}px` }}
                          className="w-full bg-amber-500/60"
                        />
                      )}
                      {day.stressed > 0 && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${(day.stressed / day.total) * maxH}px` }}
                          className="w-full bg-red-500/60 rounded-b"
                        />
                      )}
                    </>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {format(new Date(day.date), "EEE", { locale: isAr ? ar : enUS })}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 justify-center mt-3">
          {MOODS.map(m => (
            <div key={m.value} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${m.value === "happy" ? "bg-emerald-500/60" : m.value === "neutral" ? "bg-amber-500/60" : "bg-red-500/60"}`} />
              <span className="text-[10px] text-muted-foreground">{isAr ? m.ar : m.en}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's team mood */}
      <div className="glass p-4 rounded-xl">
        <h3 className="text-sm font-medium text-foreground mb-3">
          {isAr ? "حالة الفريق اليوم" : "Team Status Today"}
        </h3>
        <div className="space-y-2">
          {logs.filter(l => l.logged_date === today).map(l => {
            const moodDef = MOODS.find(m => m.value === l.mood) || MOODS[1];
            const MoodIcon = moodDef.icon;
            return (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                <div className={`w-7 h-7 rounded-full ${moodDef.bg} flex items-center justify-center`}>
                  <MoodIcon className={`h-4 w-4 ${moodDef.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground">{memberNames[l.user_id] || l.user_id.slice(0, 8)}</span>
                  {l.note && <p className="text-[10px] text-muted-foreground truncate">{l.note}</p>}
                </div>
              </div>
            );
          })}
          {logs.filter(l => l.logged_date === today).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لم يسجل أحد بعد" : "No one has logged yet"}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMood;
