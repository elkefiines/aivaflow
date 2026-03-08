import { useEffect, useState } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface Automation {
  id: string;
  project_id: string;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  action_type: string;
  action_value: string | null;
  is_active: boolean;
  created_at: string;
}

const TRIGGER_TYPES = [
  { value: "status_change", en: "Task status changes to", ar: "حالة المهمة تتغير إلى" },
  { value: "task_created", en: "New task created", ar: "إنشاء مهمة جديدة" },
  { value: "task_overdue", en: "Task becomes overdue", ar: "المهمة تصبح متأخرة" },
];

const ACTION_TYPES = [
  { value: "notify_owner", en: "Notify project owner", ar: "إشعار مالك المشروع" },
  { value: "notify_assignee", en: "Notify assignee", ar: "إشعار المسؤول" },
  { value: "notify_all", en: "Notify all members", ar: "إشعار جميع الأعضاء" },
];

const STATUSES = [
  { value: "done", en: "Done", ar: "مكتملة" },
  { value: "in_progress", en: "In Progress", ar: "قيد التنفيذ" },
  { value: "review", en: "Review", ar: "مراجعة" },
  { value: "todo", en: "To Do", ar: "للتنفيذ" },
];

const Automations = () => {
  const { projectId } = useActiveProject();
  const { user } = useAuth();
  const { lang, dir } = useLanguage();
  const isAr = lang === "ar";
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("status_change");
  const [triggerValue, setTriggerValue] = useState("done");
  const [actionType, setActionType] = useState("notify_owner");

  const load = async () => {
    if (!projectId) return;
    const { data } = await supabase.from("automations").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
    setAutomations((data as Automation[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const create = async () => {
    if (!user || !projectId || !name.trim()) return;
    await supabase.from("automations").insert({
      project_id: projectId,
      created_by: user.id,
      name: name.trim(),
      trigger_type: triggerType,
      trigger_value: triggerType === "status_change" ? triggerValue : null,
      action_type: actionType,
    } as any);
    toast.success(isAr ? "تم إنشاء القاعدة" : "Automation created");
    setName(""); setDialogOpen(false); load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("automations").update({ is_active: active } as any).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("automations").delete().eq("id", id);
    load();
  };

  const getTriggerLabel = (a: Automation) => {
    const t = TRIGGER_TYPES.find(tt => tt.value === a.trigger_type);
    const label = isAr ? t?.ar : t?.en;
    if (a.trigger_type === "status_change" && a.trigger_value) {
      const s = STATUSES.find(st => st.value === a.trigger_value);
      return `${label} "${isAr ? s?.ar : s?.en}"`;
    }
    return label;
  };

  const getActionLabel = (a: Automation) => {
    const t = ACTION_TYPES.find(at => at.value === a.action_type);
    return isAr ? t?.ar : t?.en;
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {isAr ? "الأتمتة" : "Automations"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? "قواعد تلقائية: عندما يحدث شيء → نفذ إجراء" : "Automatic rules: When something happens → Do an action"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 me-1" /> {isAr ? "قاعدة جديدة" : "New Rule"}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{isAr ? "إنشاء قاعدة أتمتة" : "Create Automation"}</DialogTitle>
              <DialogDescription>{isAr ? "عندما يحدث شيء → نفذ إجراء تلقائياً" : "When → Then automation rule"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{isAr ? "اسم القاعدة" : "Rule Name"}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={isAr ? "مثال: إشعار عند إكمال المهمة" : "e.g. Notify on task completion"} />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">{isAr ? "عندما" : "WHEN"}</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                  </SelectContent>
                </Select>
                {triggerType === "status_change" && (
                  <Select value={triggerValue} onValueChange={setTriggerValue}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-emerald-400">{isAr ? "نفّذ" : "THEN"}</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{isAr ? a.ar : a.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={create} disabled={!name.trim()} className="w-full">{isAr ? "إنشاء" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {automations.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{isAr ? "لا توجد قواعد أتمتة بعد" : "No automation rules yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass p-4 rounded-xl ${!a.is_active ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Zap className={`h-4 w-4 shrink-0 ${a.is_active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="text-primary">{isAr ? "عندما:" : "When:"}</span> {getTriggerLabel(a)}
                    {" → "}
                    <span className="text-emerald-400">{isAr ? "نفّذ:" : "Then:"}</span> {getActionLabel(a)}
                  </p>
                </div>
                <Switch checked={a.is_active} onCheckedChange={(v) => toggle(a.id, v)} />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(a.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Automations;
