import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Plus, FolderKanban } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

const ProjectSwitcher = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
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
    load();
  }, [user]);

  const switchProject = (p: Project) => {
    setActive(p);
    localStorage.setItem("active_project_id", p.id);
    window.dispatchEvent(new CustomEvent("project-changed", { detail: p.id }));
  };

  if (!active) return null;

  return (
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
      <DropdownMenuContent align="start" className="w-56">
        {projects.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => switchProject(p)} className={p.id === active.id ? "bg-accent" : ""}>
            <div className="w-4 h-4 rounded shrink-0 mr-2" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} />
            <span className="truncate">{p.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground">
          <Plus className="h-4 w-4 mr-2" />New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectSwitcher;
