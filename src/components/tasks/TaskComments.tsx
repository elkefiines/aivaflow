import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
}

interface Props {
  taskId: string;
  memberNames: Record<string, string>;
}

const TaskComments = ({ taskId, memberNames }: Props) => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
  };

  useEffect(() => {
    if (taskId) loadComments();
  }, [taskId]);

  const handleSubmit = async () => {
    if (!user || (!newComment.trim() && !file)) return;
    setLoading(true);

    let attachmentUrl: string | null = null;
    if (file) {
      const path = `${taskId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("task-attachments")
        .upload(path, file);
      if (uploadErr) {
        toast.error(t("failedToUpload") || "Failed to upload file");
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("task-attachments").getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      content: newComment.trim() || (file ? file.name : ""),
      attachment_url: attachmentUrl,
    } as any);

    setLoading(false);
    if (error) {
      toast.error(t("failedToComment") || "Failed to add comment");
      return;
    }
    setNewComment("");
    setFile(null);
    loadComments();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("task_comments").delete().eq("id", id);
    loadComments();
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground">{t("comments") || "Comments"} ({comments.length})</h4>
      
      <div className="max-h-48 overflow-y-auto space-y-2">
        {comments.map((c) => {
          const name = memberNames[c.user_id] || c.user_id.slice(0, 8);
          const initials = name.split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
          return (
            <div key={c.id} className="flex gap-2 group">
              <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
                  </span>
                  {c.user_id === user?.id && (
                    <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground/80 break-words">{c.content}</p>
                {c.attachment_url && (
                  <a href={c.attachment_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-0.5">
                    <Download className="h-3 w-3" /> {t("attachment") || "Attachment"}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t("writeComment") || "Write a comment..."}
          rows={1}
          className="text-xs bg-background/50 border-border/50 resize-none flex-1"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        />
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className={`h-7 w-7 rounded flex items-center justify-center border border-border/50 hover:bg-accent/50 transition-colors ${file ? "bg-primary/10 border-primary/30" : ""}`}>
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </label>
          <Button size="icon" className="h-7 w-7" onClick={handleSubmit} disabled={loading || (!newComment.trim() && !file)}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {file && <p className="text-[10px] text-muted-foreground">📎 {file.name}</p>}
    </div>
  );
};

export default TaskComments;
