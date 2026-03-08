import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Code, Megaphone, Calendar, FolderPlus } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  default_tasks: any[];
}

const iconMap: Record<string, typeof Code> = {
  code: Code,
  megaphone: Megaphone,
  calendar: Calendar,
  rocket: Rocket,
};

interface Props {
  onSelect: (template: Template | null) => void;
  trigger?: React.ReactNode;
}

const ProjectTemplateSelector = ({ onSelect, trigger }: Props) => {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("project_templates").select("*").then(({ data }) => {
      setTemplates((data as Template[]) || []);
    });
  }, []);

  const handleSelect = (template: Template | null) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">{t("templates") || "Templates"}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("templates") || "Project Templates"}</DialogTitle>
          <DialogDescription>{t("startFromScratch") || "Choose a template or start blank"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <div
            className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/50 hover:border-primary/30 cursor-pointer transition-colors"
            onClick={() => handleSelect(null)}
          >
            <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
              <FolderPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t("blankProject") || "Blank Project"}</p>
              <p className="text-xs text-muted-foreground">{t("startFromScratch") || "Start from scratch"}</p>
            </div>
          </div>
          {templates.map((tmpl) => {
            const Icon = iconMap[tmpl.icon] || Rocket;
            return (
              <div
                key={tmpl.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/50 hover:border-primary/30 cursor-pointer transition-colors"
                onClick={() => handleSelect(tmpl)}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tmpl.color}20` }}>
                  <Icon className="h-5 w-5" style={{ color: tmpl.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{tmpl.name}</p>
                  <p className="text-xs text-muted-foreground">{tmpl.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{tmpl.default_tasks?.length || 0} {t("tasks") || "tasks"}</span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectTemplateSelector;
