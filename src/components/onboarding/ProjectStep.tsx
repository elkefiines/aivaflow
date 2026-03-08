import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FolderPlus } from "lucide-react";

interface ProjectStepProps {
  onNext: () => void;
  onBack: () => void;
  onProjectCreated: (id: string) => void;
}

const COLORS = ["#0A26E6", "#2B39A6", "#8D5A74", "#22C55E", "#F59E0B", "#EF4444"];

const ProjectStep = ({ onNext, onBack, onProjectCreated }: ProjectStepProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: name.trim(), description: description.trim() || null, color, owner_id: user.id })
      .select("id")
      .single();
    setLoading(false);
    if (error) {
      toast.error(t("failedToCreateProject") || "Failed to create project");
      return;
    }
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