import { useEffect, useState } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Plus, Trash2, UserPlus, Lightbulb, ArrowRight, Filter } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
}

const actionIcons: Record<string, any> = {
  created: Plus,
  status_changed: ArrowRight,
  deleted: Trash2,
  joined: UserPlus,
};

const entityIcons: Record<string, any> = {
  task: CheckCircle2,
  idea: Lightbulb,
  member: UserPlus,
};

const actionColors: Record<string, string> = {
  created: "bg-emerald-500/20 text-emerald-400",
  status_changed: "bg-primary/20 text-primary",
  deleted: "bg-destructive/20 text-destructive",
  joined: "bg-amber-500/20 text-amber-400",
};

const ActivityFeed = () => {
  const { projectId } = useActiveProject();
  const { t, lang, dir } = useLanguage();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      setLoading(true);
      const [logsRes, membersRes] = await Promise.all([
        supabase.from("activity_logs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100),
        supabase.from("project_members").select("user_id").eq("project_id", projectId),
      ]);
      const userIds = (membersRes.data || []).map(m => m.user_id);
      let names: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        (profiles || []).forEach(p => { names[p.user_id] = p.display_name || "Unknown"; });
      }
      setMemberNames(names);
      setLogs((logsRes.data as ActivityLog[]) || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`activity-feed-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs", filter: `project_id=eq.${projectId}` }, (payload) => {
        setLogs(prev => [payload.new as ActivityLog, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const getActionText = (log: ActivityLog) => {
    const name = memberNames[log.user_id] || log.user_id.slice(0, 8);
    const entity = log.entity_title ? `"${log.entity_title.slice(0, 50)}"` : "";
    if (log.action === "created" && log.entity_type === "task") return `${name} ${t("activityCreatedTask")} ${entity}`;
    if (log.action === "created" && log.entity_type === "idea") return `${name} ${t("activityAddedIdea")} ${entity}`;
    if (log.action === "status_changed") {
      const to = log.metadata?.to || "";
      return `${name} ${t("activityMovedTask")} ${entity} → ${t(to as any) || to}`;
    }
    if (log.action === "deleted") return `${name} ${t("activityDeletedTask")} ${entity}`;
    if (log.action === "joined") return `${name} ${t("activityJoinedProject")}`;
    return `${name} — ${log.action}`;
  };

  const filtered = logs.filter(log => {
    if (filterType !== "all" && log.entity_type !== filterType) return false;
    if (filterAction !== "all" && log.action !== filterAction) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, ActivityLog[]>>((acc, log) => {
    const date = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("activityLog")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === "ar" ? "جميع الأنشطة في المشروع" : "All project activity"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-background/50 border-border/40 h-9">
            <Filter className="h-3 w-3 me-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل الأنواع" : "All types"}</SelectItem>
            <SelectItem value="task">{t("tasks")}</SelectItem>
            <SelectItem value="idea">{t("ideas")}</SelectItem>
            <SelectItem value="member">{t("team")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[140px] bg-background/50 border-border/40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === "ar" ? "كل الإجراءات" : "All actions"}</SelectItem>
            <SelectItem value="created">{lang === "ar" ? "إنشاء" : "Created"}</SelectItem>
            <SelectItem value="status_changed">{lang === "ar" ? "تغيير الحالة" : "Status changed"}</SelectItem>
            <SelectItem value="deleted">{lang === "ar" ? "حذف" : "Deleted"}</SelectItem>
            <SelectItem value="joined">{lang === "ar" ? "انضمام" : "Joined"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("noActivityYet")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background/80 backdrop-blur py-1">
                {format(new Date(date), "EEEE, d MMMM yyyy", { locale: lang === "ar" ? ar : enUS })}
              </h3>
              <div className="space-y-1">
                {items.map((log, i) => {
                  const Icon = actionIcons[log.action] || entityIcons[log.entity_type] || Activity;
                  const colorClass = actionColors[log.action] || "bg-muted/20 text-muted-foreground";
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-card/40 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">{getActionText(log)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
