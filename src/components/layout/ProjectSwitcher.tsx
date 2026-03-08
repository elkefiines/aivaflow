import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronsUpDown, Plus, FolderKanban, Trash2, Code, Megaphone, Calendar, Rocket, FolderPlus, Check } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Project = Tables<"projects">;

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

const ProjectSwitcher = () => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setProjects(data);
      const saved = localStorage.getItem("active_project_id");
      const found = data.find((p) => p.id === saved);
      const selected = found || data[0];
      setActive(selected);
      if (!found) {
        localStorage.setItem("active_project_id", selected.id);
        window.dispatchEvent(new CustomEvent("project-changed", { detail: selected.id }));
      }
    } else {
      setProjects([]);
      setActive(null);
    }
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (dialogOpen) {
      supabase.from("project_templates").select("*").then(({ data }) => {
        setTemplates((data as Template[]) || []);
      });
    }
  }, [dialogOpen]);

  const switchProject = (p: Project) => {
    setActive(p);
    localStorage.setItem("active_project_id", p.id);
    window.dispatchEvent(new CustomEvent("project-changed", { detail: p.id }));
  };

  const handleTemplateSelect = (tmpl: Template | null) => {
    setSelectedTemplate(tmpl);
    if (tmpl) {
      if (!name) setName(tmpl.name);
      if (!description && tmpl.description) setDescription(tmpl.description);
      setColor(tmpl.color);
    }
  };

  const createProject = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: name.trim(), description: description.trim() || null, color, owner_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error(t("failedToCreateProject") || "Failed to create project");
      setLoading(false);
      return;
    }

    // Create template tasks if selected
    if (selectedTemplate?.default_tasks?.length && data) {
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

    toast.success(t("projectCreated") || "Project created");
    setName("");
    setDescription("");
    setColor(COLORS[0]);
    setSelectedTemplate(null);
    setDialogOpen(false);
    setLoading(false);
    await load();
    if (data) switchProject(data);
  };

  const confirmDelete = (p: Project) => {
    setProjectToDelete(p);
    setDeleteDialogOpen(true);
  };

  const deleteProject = async () => {
    if (!projectToDelete) return;
    setLoading(true);
    const { error } = await supabase.from("projects").delete().eq("id", projectToDelete.id);
    setLoading(false);
    setDeleteDialogOpen(false);
    if (error) {
      toast.error(t("failedToDeleteProject") || "Failed to delete project");
      return;
    }
    toast.success(t("projectDeleted") || "Project deleted");
    if (active?.id === projectToDelete.id) {
      localStorage.removeItem("active_project_id");
    }
    setProjectToDelete(null);
    await load();
  };

  if (!active) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 font-medium text-sm max-w-[200px]">
            <div className="w-5 h-5 rounded shrink-0 flex items-center justify-center" style={{ backgroundColor: active.color || "hsl(var(--primary))" }}>
              <FolderKanban className="h-3 w-3 text-white" />
            </div>
            <span className="truncate">{active.name}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRtl ? "end" : "start"} className="w-56">
          {projects.map((p) => (
            <DropdownMenuItem key={p.id} className={`flex items-center justify-between ${p.id === active.id ? "bg-accent" : ""}`}>
              <div className="flex items-center flex-1 min-w-0" onClick={() => switchProject(p)}>
                <div className="w-4 h-4 rounded shrink-0 me-2" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} />
                <span className="truncate">{p.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); confirmDelete(p); }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive ms-2 p-0.5 rounded transition-opacity shrink-0"
                style={{ opacity: undefined }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 me-2" />{t("newProject") || "New project"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-display">{t("newProject") || "New Project"}</DialogTitle>
            <DialogDescription>{t("createFirstProject") || "Create a new project"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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

            <div className="space-y-2">
              <Label>{t("projectName") || "Project Name"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("myAwesomeProject") || "My Project"} className="bg-background/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>{t("description") || "Description"} <span className="text-muted-foreground">({t("optional") || "optional"})</span></Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("whatIsProjectAbout") || "What's this project about?"} rows={2} className="bg-background/50 border-border/50 resize-none" />
            </div>
            <div className="space-y-2">
              <Label>{t("color") || "Color"}</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={createProject} disabled={loading || !name.trim()} className="w-full">
              {loading ? t("creating") || "Creating…" : t("newProject") || "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteProject") || "Delete Project"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteProjectConfirm") || `Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? t("deleting") || "Deleting…" : t("delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectSwitcher;
