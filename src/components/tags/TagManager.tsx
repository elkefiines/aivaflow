import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Tags as TagsIcon, Palette } from "lucide-react";
import { toast } from "sonner";

const TAG_COLORS = [
  "#0A26E6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  taskId?: string;
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  mode?: "manage" | "select";
}

const TagManager = ({ taskId, selectedTagIds = [], onTagsChange, mode = "manage" }: TagManagerProps) => {
  const { projectId } = useActiveProject();
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const [tags, setTags] = useState<Tag[]>([]);
  const [taskTagIds, setTaskTagIds] = useState<string[]>(selectedTagIds);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [showAdd, setShowAdd] = useState(false);

  const fetchTags = async () => {
    if (!projectId) return;
    const { data } = await supabase.from("tags").select("*").eq("project_id", projectId).order("name");
    setTags(data || []);
  };

  const fetchTaskTags = async () => {
    if (!taskId) return;
    const { data } = await supabase.from("task_tags").select("tag_id").eq("task_id", taskId);
    const ids = data?.map(d => d.tag_id) || [];
    setTaskTagIds(ids);
    onTagsChange?.(ids);
  };

  useEffect(() => { fetchTags(); }, [projectId]);
  useEffect(() => { if (taskId) fetchTaskTags(); }, [taskId]);

  const addTag = async () => {
    if (!newName.trim() || !projectId) return;
    const { error } = await supabase.from("tags").insert({ name: newName.trim(), color: newColor, project_id: projectId });
    if (error) { toast.error(isRtl ? "فشل إنشاء العلامة" : "Failed to create tag"); return; }
    setNewName("");
    setShowAdd(false);
    fetchTags();
    toast.success(isRtl ? "تم إنشاء العلامة" : "Tag created");
  };

  const deleteTag = async (id: string) => {
    await supabase.from("tags").delete().eq("id", id);
    fetchTags();
    toast.success(isRtl ? "تم حذف العلامة" : "Tag deleted");
  };

  const toggleTaskTag = async (tagId: string) => {
    if (!taskId) return;
    if (taskTagIds.includes(tagId)) {
      await supabase.from("task_tags").delete().eq("task_id", taskId).eq("tag_id", tagId);
      const updated = taskTagIds.filter(id => id !== tagId);
      setTaskTagIds(updated);
      onTagsChange?.(updated);
    } else {
      await supabase.from("task_tags").insert({ task_id: taskId, tag_id: tagId });
      const updated = [...taskTagIds, tagId];
      setTaskTagIds(updated);
      onTagsChange?.(updated);
    }
  };

  if (mode === "select") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {tags.map(tag => (
            <Badge
              key={tag.id}
              variant={taskTagIds.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              style={taskTagIds.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color, color: "#fff" } : { borderColor: tag.color, color: tag.color }}
              onClick={() => toggleTaskTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length === 0 && <span className="text-xs text-muted-foreground">{isRtl ? "لا توجد علامات" : "No tags"}</span>}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TagsIcon className="h-5 w-5" />
          {isRtl ? "إدارة العلامات" : "Manage Tags"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag.id} className="gap-1 pr-1" style={{ backgroundColor: tag.color, color: "#fff" }}>
              {tag.name}
              <button onClick={() => deleteTag(tag.id)} className="hover:bg-white/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && <span className="text-sm text-muted-foreground">{isRtl ? "لا توجد علامات بعد" : "No tags yet"}</span>}
        </div>
        {showAdd ? (
          <div className="flex items-center gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={isRtl ? "اسم العلامة" : "Tag name"} className="flex-1 h-8 text-sm" onKeyDown={e => e.key === "Enter" && addTag()} />
            <div className="flex gap-1">
              {TAG_COLORS.map(c => (
                <button key={c} className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setNewColor(c)} />
              ))}
            </div>
            <Button size="sm" onClick={addTag} disabled={!newName.trim()}>{isRtl ? "إضافة" : "Add"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1">
            <Plus className="h-3 w-3" /> {isRtl ? "علامة جديدة" : "New Tag"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TagManager;
