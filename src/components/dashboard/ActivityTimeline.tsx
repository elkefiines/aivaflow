import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Trash2, UserPlus, Lightbulb, ArrowRight, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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

const actionIcons: Record<string, typeof Plus> = {
  created: Plus,
  status_changed: ArrowRight,
  deleted: Trash2,
  joined: UserPlus,
};

const entityIcons: Record<string, typeof Plus> = {
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

interface Props {
  projectId: string;
  memberNames?: Record<string, string>;
}

const ActivityTimeline = ({ projectId, memberNames = {} }: Props) => {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(15);
    setLogs((data as ActivityLog[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!projectId) return;
    loadLogs();
    const channel = supabase
      .channel(`activity-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs", filter: `project_id=eq.${projectId}` }, () => loadLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const getActionText = (log: ActivityLog) => {
    const name = memberNames[log.user_id] || log.user_id.slice(0, 8);
    const entity = log.entity_title ? `"${log.entity_title.slice(0, 40)}"` : "";

    if (log.action === "created" && log.entity_type === "task") return `${name} ${t("activityCreatedTask")} ${entity}`;
    if (log.action === "created" && log.entity_type === "idea") return `${name} ${t("activityAddedIdea")} ${entity}`;
    if (log.action === "status_changed") {
      const from = log.metadata?.from || "";
      const to = log.metadata?.to || "";
      return `${name} ${t("activityMovedTask")} ${entity} → ${t(to) || to}`;
    }
    if (log.action === "deleted") return `${name} ${t("activityDeletedTask")} ${entity}`;
    if (log.action === "joined") return `${name} ${t("activityJoinedProject")}`;
    return `${name} — ${log.action}`;
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted/30 rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-1.5">
      {logs.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">{t("noActivityYet")}</p>}
      {logs.map((log, i) => {
        const Icon = actionIcons[log.action] || entityIcons[log.entity_type] || Activity;
        const colorClass = actionColors[log.action] || "bg-muted/20 text-muted-foreground";
        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2.5 py-1.5"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground leading-relaxed truncate">{getActionText(log)}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
