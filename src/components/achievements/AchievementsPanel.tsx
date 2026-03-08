import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Flame, Zap, Target, Clock, Users, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Achievement {
  key: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: any;
  color: string;
  check: (stats: Stats) => boolean;
}

interface Stats {
  totalDone: number;
  totalTasks: number;
  streak: number;
  totalHours: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { key: "first_task", title: { en: "First Step", ar: "الخطوة الأولى" }, description: { en: "Complete your first task", ar: "أكمل أول مهمة" }, icon: Star, color: "#f59e0b", check: s => s.totalDone >= 1 },
  { key: "task_10", title: { en: "Productive", ar: "منتج" }, description: { en: "Complete 10 tasks", ar: "أكمل 10 مهام" }, icon: CheckCircle2, color: "#10b981", check: s => s.totalDone >= 10 },
  { key: "task_50", title: { en: "Task Master", ar: "سيد المهام" }, description: { en: "Complete 50 tasks", ar: "أكمل 50 مهمة" }, icon: Trophy, color: "#8b5cf6", check: s => s.totalDone >= 50 },
  { key: "task_100", title: { en: "Centurion", ar: "المئوي" }, description: { en: "Complete 100 tasks", ar: "أكمل 100 مهمة" }, icon: Zap, color: "#ef4444", check: s => s.totalDone >= 100 },
  { key: "streak_3", title: { en: "On Fire", ar: "مشتعل" }, description: { en: "3-day streak", ar: "سلسلة 3 أيام" }, icon: Flame, color: "#f97316", check: s => s.streak >= 3 },
  { key: "streak_7", title: { en: "Unstoppable", ar: "لا يوقف" }, description: { en: "7-day streak", ar: "سلسلة 7 أيام" }, icon: Flame, color: "#dc2626", check: s => s.streak >= 7 },
  { key: "hours_10", title: { en: "Time Tracker", ar: "متتبع الوقت" }, description: { en: "Track 10+ hours", ar: "تتبع أكثر من 10 ساعات" }, icon: Clock, color: "#06b6d4", check: s => s.totalHours >= 10 },
  { key: "task_creator_20", title: { en: "Planner", ar: "المخطط" }, description: { en: "Create 20+ tasks", ar: "أنشئ أكثر من 20 مهمة" }, icon: Target, color: "#6366f1", check: s => s.totalTasks >= 20 },
];

const AchievementsPanel = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [newUnlock, setNewUnlock] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;
    const check = async () => {
      // Fetch existing achievements
      const { data: existing } = await supabase
        .from("user_achievements" as any)
        .select("achievement_key")
        .eq("user_id", user.id);
      const unlockedKeys = new Set((existing as any[])?.map(e => e.achievement_key) || []);

      // Fetch stats
      const [tasksRes, timeRes] = await Promise.all([
        supabase.from("tasks").select("status, created_by, assignee_id, updated_at").eq("project_id", projectId),
        supabase.from("time_entries").select("duration_minutes").eq("user_id", user.id),
      ]);
      const myTasks = (tasksRes.data || []).filter(t => t.assignee_id === user.id || t.created_by === user.id);
      const myDone = myTasks.filter(t => t.status === "done");
      const totalHours = (timeRes.data || []).reduce((s, e) => s + (e.duration_minutes || 0), 0) / 60;

      // Calculate streak
      let streak = 0;
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const day = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
        if (myDone.some(t => t.updated_at?.startsWith(day))) streak++;
        else if (i > 0) break;
      }

      const stats: Stats = { totalDone: myDone.length, totalTasks: myTasks.length, streak, totalHours };

      // Check for new achievements
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedKeys.has(ach.key) && ach.check(stats)) {
          await (supabase.from("user_achievements" as any) as any).insert({
            user_id: user.id,
            achievement_key: ach.key,
          });
          unlockedKeys.add(ach.key);
          setNewUnlock(ach.key);
          toast.success(`🏆 ${isRtl ? ach.title.ar : ach.title.en}!`, {
            description: isRtl ? ach.description.ar : ach.description.en,
          });
          setTimeout(() => setNewUnlock(null), 3000);
        }
      }
      setUnlocked(unlockedKeys);
    };
    check();
  }, [user, projectId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {isRtl ? "الإنجازات" : "Achievements"} ({unlocked.size}/{ACHIEVEMENTS.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlocked.has(ach.key);
            const isNew = newUnlock === ach.key;
            return (
              <motion.div
                key={ach.key}
                initial={isNew ? { scale: 0 } : false}
                animate={isNew ? { scale: [0, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
                className={`flex flex-col items-center p-3 rounded-lg border text-center ${isUnlocked ? "bg-card border-border" : "bg-muted/30 border-border/20 opacity-40"}`}
              >
                <ach.icon className="h-8 w-8 mb-1" style={{ color: isUnlocked ? ach.color : undefined }} />
                <span className="text-xs font-medium text-foreground">{isRtl ? ach.title.ar : ach.title.en}</span>
                <span className="text-[10px] text-muted-foreground">{isRtl ? ach.description.ar : ach.description.en}</span>
                {isUnlocked && <Badge variant="secondary" className="mt-1 text-[9px]">✓</Badge>}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;
