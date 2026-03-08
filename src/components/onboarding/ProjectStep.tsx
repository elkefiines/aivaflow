import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FolderPlus, Code, Megaphone, Calendar, Rocket, Check } from "lucide-react";

interface ProjectStepProps {
  onNext: () => void;
  onBack: () => void;
  onProjectCreated: (id: string) => void;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  default_tasks: any[];
}

const COLORS = ["#0A26E6", "#2B39A6", "#8D5A74", "#22C55E", "#F59E0B", "#EF4444"];
const iconMap: Record<string, typeof Code> = { code: Code, megaphone: Megaphone, calendar: Calendar, rocket: Rocket };

const ProjectStep = ({ onNext, onBack, onProjectCreated }: ProjectStepProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    supabase.from("project_templates").select("*").then(({ data }) => {
      setTemplates((data as Template[]) || []);
    });
  }, []);

  const handleTemplateSelect = (tmpl: Template | null) => {
    setSelectedTemplate(tmpl);
    if (tmpl) {
      if (!name) setName(tmpl.name);
      if (!description && tmpl.description) setDescription(tmpl.description);
      setColor(tmpl.color);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: name.trim(), description: description.trim() || null, color, owner_id: user.id })
      .select("id")
      .single();
    if (error) {
      toast.error(t("failedToCreateProject") || "Failed to create project");
      setLoading(false);
      return;
    }

    // Create template tasks if selected
    if (selectedTemplate?.default_tasks?.length) {
      const tasks = selectedTemplate.default_tasks.map((task: any, i: number) => ({
        title: task.title,
        priority: task.priority || "medium",
        status: task.status || "todo",
        project_id: data.id,
        created_by: user.id,
        position: i,
        ai_generated: false,
      }));
      await supabase.from("tasks").insert(tasks);
    }

    setLoading(false);
    localStorage.setItem("active_project_id", data.id);
    window.dispatchEvent(new CustomEvent("project-changed", { detail: data.id }));
    onProjectCreated(data.id);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <FolderPlus className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">{t("createFirstProject") || "Create your first project"}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("projectsOrganize") || "Projects organize your tasks and ideas"}</p>
      </div>

      {/* Template selector */}
      <div className="space-y-2">
        <Label>{t("templates") || "Template"}</Label>
        <div className="grid grid-cols-2 gap-2">
          <div
            className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${!selectedTemplate ? "border-primary/50 bg-primary/5" : "border-border/30 hover:border-primary/30"}`}
            onClick={() => handleTemplateSelect(null)}
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{t("blankProject") || "Blank"}</span>
              {!selectedTemplate && <Check className="h-3 w-3 text-primary ms-auto" />}
            </div>
          </div>
          {templates.map((tmpl) => {
            const Icon = iconMap[tmpl.icon] || Rocket;
            const selected = selectedTemplate?.id === tmpl.id;
            return (
              <div
                key={tmpl.id}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${selected ? "border-primary/50 bg-primary/5" : "border-border/30 hover:border-primary/30"}`}
                onClick={() => handleTemplateSelect(tmpl)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: tmpl.color }} />
                  <span className="text-xs font-medium text-foreground truncate">{tmpl.name}</span>
                  {selected && <Check className="h-3 w-3 text-primary ms-auto shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">{t("projectName")}</Label>
          <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("myAwesomeProject") || "My Awesome Project"} required className="bg-background/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectDesc">{t("description")} <span className="text-muted-foreground">({t("optional") || "optional"})</span></Label>
          <Textarea id="projectDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("whatIsProjectAbout") || "What's this project about?"} rows={2} className="bg-background/50 border-border/50 resize-none" />
        </div>
        <div className="space-y-2">
          <Label>{t("color")}</Label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">{t("back") || "Back"}</Button>
        <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
          {loading ? t("creating") || "Creating…" : t("createAndContinue") || "Create & continue"}
        </Button>
      </div>
    </form>
  );
};

export default ProjectStep;