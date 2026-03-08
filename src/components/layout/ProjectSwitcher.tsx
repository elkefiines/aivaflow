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
import { ChevronsUpDown, Plus, FolderKanban } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Project = Tables<"projects">;

const COLORS = ["#0A26E6", "#2B39A6", "#8D5A74", "#22C55E", "#F59E0B", "#EF4444"];

const ProjectSwitcher = () => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

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
    }
  };

  useEffect(() => { load(); }, [user]);

  const switchProject = (p: Project) => {
    setActive(p);
    localStorage.setItem("active_project_id", p.id);
    window.dispatchEvent(new CustomEvent("project-changed", { detail: p.id }));
  };

  const createProject = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: name.trim(), description: description.trim() || null, color, owner_id: user.id })
      .select()
      .single();
    setLoading(false);
    if (error) {
      toast.error(t("failedToCreateProject") || "Failed to create project");
      return;
    }
    toast.success(t("projectCreated") || "Project created");
    setName("");
    setDescription("");
    setColor(COLORS[0]);
    setDialogOpen(false);
    await load();
    if (data) switchProject(data);
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
            <DropdownMenuItem key={p.id} onClick={() => switchProject(p)} className={p.id === active.id ? "bg-accent" : ""}>
              <div className="w-4 h-4 rounded shrink-0 me-2" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} />
              <span className="truncate">{p.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 me-2" />{t("newProject") || "New project"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-display">{t("newProject") || "New Project"}</DialogTitle>
            <DialogDescription>{t("createFirstProject") || "Create a new project"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
              {loading ? t("creating") || "Creating…" : t("createTask") ? t("newProject") || "Create Project" : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectSwitcher;