import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, X } from "lucide-react";

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

interface SubtasksListProps {
  taskId: string;
}

const SubtasksList = ({ taskId }: SubtasksListProps) => {
  const { t } = useLanguage();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true });
    setSubtasks((data as Subtask[]) || []);
  };

  useEffect(() => {
    load();
  }, [taskId]);

  const addSubtask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await supabase.from("subtasks").insert({
      task_id: taskId,
      title: newTitle.trim(),
      position: subtasks.length,
    } as any);
    setNewTitle("");
    setAdding(false);
    load();
  };

  const toggleComplete = async (sub: Subtask) => {
    await supabase
      .from("subtasks")
      .update({ is_completed: !sub.is_completed } as any)
      .eq("id", sub.id);
    load();
  };

  const deleteSubtask = async (id: string) => {
    await supabase.from("subtasks").delete().eq("id", id);
    load();
  };

  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("subtasks")}</span>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <Progress value={progress} className="h-1.5" />
      )}

      <div className="space-y-1">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-2 group rounded-md px-2 py-1 hover:bg-muted/50"
          >
            <Checkbox
              checked={sub.is_completed}
              onCheckedChange={() => toggleComplete(sub)}
            />
            <span
              className={`flex-1 text-sm ${
                sub.is_completed
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {sub.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => deleteSubtask(sub.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("addSubtask")}
          className="h-8 text-sm bg-background/50 border-border/40"
          onKeyDown={(e) => e.key === "Enter" && addSubtask()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={addSubtask}
          disabled={adding || !newTitle.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default SubtasksList;
