import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SaveAsTemplate = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!projectId || !user || !name.trim()) return;
    setSaving(true);
    try {
      // Fetch current project tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("title, description, status, priority")
        .eq("project_id", projectId);

      const { data: project } = await supabase
        .from("projects")
        .select("color, icon")
        .eq("id", projectId)
        .single();

      const defaultTasks = (tasks || []).map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority || "medium",
      }));

      const { error } = await supabase.from("project_templates").insert({
        name: name.trim(),
        description: description.trim() || null,
        color: project?.color || "#0A26E6",
        icon: project?.icon || "folder",
        category: "custom",
        default_tasks: defaultTasks,
      } as any);

      if (error) throw error;
      toast.success(isRtl ? "تم حفظ القالب بنجاح" : "Template saved successfully");
      setName("");
      setDescription("");
    } catch {
      toast.error(isRtl ? "فشل حفظ القالب" : "Failed to save template");
    }
    setSaving(false);
  };

  if (!projectId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Copy className="h-5 w-5" />
          {isRtl ? "حفظ المشروع كقالب" : "Save Project as Template"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {isRtl ? "سيتم حفظ جميع المهام الحالية كقالب قابل لإعادة الاستخدام عند إنشاء مشاريع جديدة." : "All current tasks will be saved as a reusable template for new projects."}
        </p>
        <div className="space-y-2">
          <Label>{isRtl ? "اسم القالب" : "Template Name"}</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder={isRtl ? "مثال: قالب تطوير البرمجيات" : "e.g. Software Development Template"} />
        </div>
        <div className="space-y-2">
          <Label>{isRtl ? "الوصف" : "Description"}</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={isRtl ? "وصف اختياري..." : "Optional description..."} className="resize-none" />
        </div>
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {isRtl ? "حفظ كقالب" : "Save as Template"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SaveAsTemplate;
