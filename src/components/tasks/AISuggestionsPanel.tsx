import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, ArrowUpDown, Clock, Target } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  title: string;
  description: string;
  priority: string;
  category: string;
}

interface Props {
  tasks: any[];
  memberNames: Record<string, string>;
}

const categoryIcons: Record<string, typeof Target> = {
  distribution: ArrowUpDown,
  risk: AlertTriangle,
  priority: Target,
  timeline: Clock,
};

const categoryColors: Record<string, string> = {
  distribution: "bg-primary/10 text-primary border-primary/20",
  risk: "bg-destructive/10 text-destructive border-destructive/20",
  priority: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  timeline: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const AISuggestionsPanel = ({ tasks, memberNames }: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [summary, setSummary] = useState("");

  const fetchSuggestions = async () => {
    setLoading(true);
    setOpen(true);
    setSuggestions([]);
    setSummary("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-suggest", {
        body: {
          tasks: tasks.map((t) => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            assignee: t.assignee_id ? memberNames[t.assignee_id] || "Unknown" : "Unassigned",
            due_date: t.due_date,
          })),
          members: Object.values(memberNames),
          type: "general",
        },
      });

      if (error) throw error;
      setSuggestions(data?.suggestions || []);
      setSummary(data?.summary || "");
    } catch (e: any) {
      toast.error(t("aiSuggestFailed") || "Failed to get AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={fetchSuggestions} className="gap-1.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">{t("aiSuggest") || "AI Suggest"}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("aiSuggestions") || "AI Suggestions"}
            </DialogTitle>
            <DialogDescription>{t("aiSuggestionsDesc") || "AI-powered recommendations for your project"}</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{t("analyzing") || "Analyzing your project..."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground">{summary}</p>
                </div>
              )}
              <div className="space-y-2">
                {suggestions.map((s, i) => {
                  const Icon = categoryIcons[s.category] || Target;
                  const colorClass = categoryColors[s.category] || "bg-muted/10 text-muted-foreground border-muted/20";
                  return (
                    <div key={i} className="p-3 rounded-lg border border-border/30 bg-background/50 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1">{s.title}</span>
                        <Badge variant="outline" className={`text-[10px] ${s.priority === "high" ? "border-amber-500/30 text-amber-400" : ""}`}>
                          {s.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground ps-8">{s.description}</p>
                    </div>
                  );
                })}
              </div>
              {suggestions.length === 0 && !summary && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("noSuggestions") || "No suggestions available"}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AISuggestionsPanel;
