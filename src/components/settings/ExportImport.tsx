import { useState } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const ExportImport = () => {
  const { projectId } = useActiveProject();
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const [exporting, setExporting] = useState(false);

  const exportJSON = async () => {
    if (!projectId) return;
    setExporting(true);
    try {
      const [tasksRes, goalsRes, ideasRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("goals").select("*").eq("project_id", projectId),
        supabase.from("ideas").select("*").eq("project_id", projectId),
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        tasks: tasksRes.data || [],
        goals: goalsRes.data || [],
        ideas: ideasRes.data || [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isRtl ? "تم التصدير بنجاح" : "Export successful");
    } catch {
      toast.error(isRtl ? "فشل التصدير" : "Export failed");
    }
    setExporting(false);
  };

  const exportCSV = async () => {
    if (!projectId) return;
    setExporting(true);
    try {
      const { data: tasks } = await supabase.from("tasks").select("*").eq("project_id", projectId);
      if (!tasks?.length) { toast.error(isRtl ? "لا توجد مهام" : "No tasks"); setExporting(false); return; }
      const headers = ["title", "status", "priority", "assignee_id", "start_date", "due_date", "created_at"];
      const csv = [
        headers.join(","),
        ...tasks.map(t => headers.map(h => `"${(t as any)[h] || ""}"`).join(","))
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isRtl ? "تم التصدير بنجاح" : "Export successful");
    } catch {
      toast.error(isRtl ? "فشل التصدير" : "Export failed");
    }
    setExporting(false);
  };

  const importJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.tasks?.length) {
        const tasksToInsert = data.tasks.map((t: any) => ({
          title: t.title,
          description: t.description || null,
          status: t.status || "todo",
          priority: t.priority || "medium",
          project_id: projectId,
          due_date: t.due_date || null,
          start_date: t.start_date || null,
        }));
        await supabase.from("tasks").insert(tasksToInsert);
      }
      toast.success(isRtl ? `تم استيراد ${data.tasks?.length || 0} مهمة` : `Imported ${data.tasks?.length || 0} tasks`);
    } catch {
      toast.error(isRtl ? "ملف غير صالح" : "Invalid file");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-5 w-5" />
            {isRtl ? "تصدير المشروع" : "Export Project"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={exportJSON} disabled={exporting} className="w-full justify-start gap-2" variant="outline">
            <FileJson className="h-4 w-4" />
            {isRtl ? "تصدير JSON (مهام + أهداف + أفكار)" : "Export JSON (Tasks + Goals + Ideas)"}
          </Button>
          <Button onClick={exportCSV} disabled={exporting} className="w-full justify-start gap-2" variant="outline">
            <FileSpreadsheet className="h-4 w-4" />
            {isRtl ? "تصدير CSV (المهام فقط)" : "Export CSV (Tasks only)"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isRtl ? "استيراد مشروع" : "Import Project"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label>
            <input type="file" accept=".json" className="hidden" onChange={importJSON} />
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <span className="cursor-pointer">
                <FileJson className="h-4 w-4" />
                {isRtl ? "استيراد من ملف JSON" : "Import from JSON file"}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            {isRtl ? "يدعم ملفات JSON المصدرة من هذا التطبيق" : "Supports JSON files exported from this app"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportImport;
