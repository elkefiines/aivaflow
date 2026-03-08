import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TaskTemplate {
  id: string;
  project_id: string;
  created_by: string;
  name: string;
  description: string | null;
  default_priority: string | null;
  default_status: string | null;
  subtask_titles: string[];
  created_at: string;
}

interface Props {
  projectId: string;
  onUseTemplate: (template: TaskTemplate) => void;
}

const PRIORITIES = ["low", "medium", "high", "critical"];

const TaskTemplateManager = ({ projectId, onUseTemplate }: Props) => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("task_templates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setTemplates((data || []).map((d: any) => ({
      ...d,
      subtask_titles: Array.isArray(d.subtask_titles) ? d.subtask_titles : [],
    })));
  };

  useEffect(() => {
    if (projectId) loadTemplates();
  }, [projectId]);

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks(prev => [...prev, subtaskInput.trim()]);
      setSubtaskInput("");
    }
  };

  const createTemplate = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("task_templates").insert({
      project_id: projectId,
      created_by: user.id,
      name: name.trim(),
      description: description.trim() || null,
      default_priority: priority,
      subtask_titles: subtasks as any,
    } as any);
    if (error) { toast.error("Failed to create template"); return; }
    toast.success(lang === "ar" ? "تم إنشاء القالب" : "Template created");
    setName(""); setDescription(""); setPriority("medium"); setSubtasks([]);
    setCreateOpen(false);
    loadTemplates();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("task_templates").delete().eq("id", id);
    loadTemplates();
  };

  const priorityLabels: Record<string, string> = {
    low: t("low"), medium: t("medium"), high: t("high"), critical: t("critical"),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2">
          <FileText className="h-4 w-4 me-1" />
          <span className="hidden sm:inline">{t("templates")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{t("templates")}</DialogTitle>
          <DialogDescription>{lang === "ar" ? "قوالب جاهزة لإنشاء المهام بسرعة" : "Pre-built templates for quick task creation"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {templates.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {lang === "ar" ? "لا توجد قوالب بعد" : "No templates yet"}
            </p>
          )}
          {templates.map(tmpl => (
            <div key={tmpl.id} className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/20 hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tmpl.name}</p>
                {tmpl.description && <p className="text-xs text-muted-foreground truncate">{tmpl.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{priorityLabels[tmpl.default_priority || "medium"]}</span>
                  {tmpl.subtask_titles.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">• {tmpl.subtask_titles.length} {t("subtasks")}</span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => deleteTemplate(tmpl.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button size="sm" className="h-7" onClick={() => { onUseTemplate(tmpl); setOpen(false); }}>
                {t("useTemplate")}
              </Button>
            </div>
          ))}
        </div>

        {/* Create new template inline */}
        {!createOpen ? (
          <Button variant="outline" className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 me-2" /> {lang === "ar" ? "إنشاء قالب جديد" : "Create New Template"}
          </Button>
        ) : (
          <div className="space-y-3 p-3 rounded-lg border border-border/30 bg-card/50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{lang === "ar" ? "قالب جديد" : "New Template"}</h4>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCreateOpen(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>{t("title")}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={lang === "ar" ? "اسم القالب" : "Template name"} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>{t("description")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="bg-background/50 resize-none" />
            </div>
            <div className="space-y-2">
              <Label>{t("priority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("subtasks")}</Label>
              <div className="flex gap-2">
                <Input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} placeholder={t("addSubtask")}
                  className="bg-background/50" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubtask())} />
                <Button size="sm" variant="outline" onClick={addSubtask}>{t("add")}</Button>
              </div>
              {subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1">• {s}</span>
                  <button onClick={() => setSubtasks(prev => prev.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={createTemplate} disabled={!name.trim()} className="w-full">
              {lang === "ar" ? "إنشاء القالب" : "Create Template"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskTemplateManager;
