import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Lightbulb, Sparkles, Plus, Loader2, CheckCircle2, ArrowRight, Trash2,
} from "lucide-react";
import FileUploadZone from "@/components/ideas/FileUploadZone";

type Idea = Tables<"ideas">;
type AiTask = { title: string; description?: string; priority: string };

const Ideas = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    raw: { label: t("draft"), color: "bg-muted/20 text-muted-foreground border-muted/30", icon: <Lightbulb className="h-3 w-3" /> },
    processing: { label: t("processing"), color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    converted: { label: t("converted"), color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
    archived: { label: t("archived"), color: "bg-muted/20 text-muted-foreground border-muted/30", icon: null },
  };

  const priorityBadge: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    medium: "bg-primary/20 text-primary border-primary/30",
    low: "bg-muted/20 text-muted-foreground border-muted/30",
  };

  const priorityLabels: Record<string, string> = {
    critical: t("critical"),
    high: t("high"),
    medium: t("medium"),
    low: t("low"),
  };

  const loadIdeas = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from("ideas")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setIdeas(data || []);
  };

  useEffect(() => {
    loadIdeas();
  }, [projectId]);

  const submitIdea = async () => {
    if (!user || !projectId || !newText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("ideas").insert({
      raw_text: newText.trim(),
      project_id: projectId,
      user_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to save idea");
      return;
    }
    toast.success("Idea saved");
    setNewText("");
    loadIdeas();
  };

  const processIdea = async (ideaId: string) => {
    setProcessingId(ideaId);
    setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, status: "processing" as Idea["status"] } : i)));

    const { data, error } = await supabase.functions.invoke("process-idea", {
      body: { idea_id: ideaId },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Failed to process idea");
      loadIdeas();
    } else {
      toast.success(`Extracted ${data.tasks?.length || 0} tasks`);
      loadIdeas();
    }
    setProcessingId(null);
  };

  const convertToTasks = async (idea: Idea) => {
    if (!user || !projectId) return;
    const aiTasks = (idea.ai_tasks || []) as AiTask[];
    if (aiTasks.length === 0) return;

    const inserts = aiTasks.map((t, i) => ({
      title: t.title,
      description: t.description || null,
      priority: t.priority as "low" | "medium" | "high" | "critical",
      status: "todo" as const,
      project_id: projectId,
      created_by: user.id,
      ai_generated: true,
      source_idea_id: idea.id,
      position: i,
    }));

    const { error } = await supabase.from("tasks").insert(inserts);
    if (error) {
      toast.error("Failed to create tasks");
      return;
    }
    toast.success(`${inserts.length} tasks created`);
    await supabase.from("ideas").update({ status: "archived" as Idea["status"] }).eq("id", idea.id);
    loadIdeas();
  };

  const deleteIdea = async (ideaId: string) => {
    const { error } = await supabase.from("ideas").delete().eq("id", ideaId);
    if (error) { toast.error("Failed to delete"); return; }
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("ideasTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("ideasSubtitle")}</p>
      </div>

      <Card className="p-4 border-border/40 bg-card/80">
        <Textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={t("pasteNotes")}
          rows={4}
          className="bg-background/50 border-border/50 resize-none mb-3"
        />
        <div className="flex justify-end">
          <Button onClick={submitIdea} disabled={submitting || !newText.trim()}>
            <Plus className="h-4 w-4 me-2" />
            {submitting ? t("saving") : t("saveIdea")}
          </Button>
        </div>
      </Card>

      {projectId && <FileUploadZone projectId={projectId} onComplete={loadIdeas} />}

      <div className="space-y-4">
        {ideas.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t("noIdeasYet")}</p>
          </div>
        )}

        {ideas.map((idea) => {
          const status = statusConfig[idea.status || "raw"];
          const aiTasks = (idea.ai_tasks || []) as AiTask[];
          const isProcessing = processingId === idea.id || idea.status === "processing";

          return (
            <Card key={idea.id} className="p-4 border-border/40 bg-card/80">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                    {idea.raw_text}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.color}`}>
                    {status.icon}
                    <span className="ms-1">{status.label}</span>
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteIdea(idea.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {idea.ai_summary && (
                <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {t("aiSummary")}
                  </p>
                  <p className="text-sm text-foreground/80">{idea.ai_summary}</p>
                </div>
              )}

              {aiTasks.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{t("extractedTasks")}</p>
                  {aiTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="text-sm text-foreground flex-1">{t.title}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityBadge[t.priority] || ""}`}>
                        {priorityLabels[t.priority] || t.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {(idea.status === "raw" || idea.status === null) && (
                  <Button size="sm" variant="outline" onClick={() => processIdea(idea.id)} disabled={isProcessing}>
                    {isProcessing ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />{t("processing")}</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5 me-1.5" />{t("extractTasks")}</>
                    )}
                  </Button>
                )}
                {idea.status === "converted" && aiTasks.length > 0 && (
                  <Button size="sm" onClick={() => convertToTasks(idea)}>
                    <ArrowRight className={`h-3.5 w-3.5 me-1.5 ${isRtl ? "rotate-180" : ""}`} />
                    {t("createTask")} ({aiTasks.length})
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Ideas;