import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  raw: { label: "Draft", color: "bg-muted/20 text-muted-foreground border-muted/30", icon: <Lightbulb className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  converted: { label: "Converted", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  archived: { label: "Archived", color: "bg-muted/20 text-muted-foreground border-muted/30", icon: null },
};

const Ideas = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    // Optimistic update
    setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, status: "processing" as Idea["status"] } : i)));

    const { data, error } = await supabase.functions.invoke("process-idea", {
      body: { idea_id: ideaId },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Failed to process idea");
      loadIdeas(); // revert
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

  const priorityBadge: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    medium: "bg-primary/20 text-primary border-primary/30",
    low: "bg-muted/20 text-muted-foreground border-muted/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Ideas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste rough notes and let AI convert them into structured tasks
        </p>
      </div>

      {/* Input area */}
      <Card className="p-4 border-border/40 bg-card/80">
        <Textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Paste your rough notes, meeting minutes, or brain dump here…"
          rows={4}
          className="bg-background/50 border-border/50 resize-none mb-3"
        />
        <div className="flex justify-end">
          <Button onClick={submitIdea} disabled={submitting || !newText.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {submitting ? "Saving…" : "Save Idea"}
          </Button>
        </div>
      </Card>

      {/* File upload */}
      {projectId && <FileUploadZone projectId={projectId} onComplete={loadIdeas} />}

      {/* Ideas list */}
      <div className="space-y-4">
        {ideas.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No ideas yet. Paste some notes above to get started.</p>
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
                    <span className="ml-1">{status.label}</span>
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteIdea(idea.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* AI summary */}
              {idea.ai_summary && (
                <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Summary
                  </p>
                  <p className="text-sm text-foreground/80">{idea.ai_summary}</p>
                </div>
              )}

              {/* AI extracted tasks */}
              {aiTasks.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Extracted Tasks</p>
                  {aiTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="text-sm text-foreground flex-1">{t.title}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityBadge[t.priority] || ""}`}>
                        {t.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {(idea.status === "raw" || idea.status === null) && (
                  <Button size="sm" variant="outline" onClick={() => processIdea(idea.id)} disabled={isProcessing}>
                    {isProcessing ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processing…</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Extract Tasks with AI</>
                    )}
                  </Button>
                )}
                {idea.status === "converted" && aiTasks.length > 0 && (
                  <Button size="sm" onClick={() => convertToTasks(idea)}>
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Create {aiTasks.length} Tasks
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
