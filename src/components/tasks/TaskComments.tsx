import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, Trash2, Download, Reply, AtSign } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  parent_id: string | null;
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
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleTextChange = (value: string) => {
    setNewComment(value);
    const lastAt = value.lastIndexOf("@");
    if (lastAt >= 0 && (lastAt === 0 || value[lastAt - 1] === " ")) {
      const after = value.slice(lastAt + 1);
      if (!after.includes(" ")) {
        setShowMentions(true);
        setMentionFilter(after.toLowerCase());
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (name: string) => {
    const lastAt = newComment.lastIndexOf("@");
    const before = newComment.slice(0, lastAt);
    setNewComment(`${before}@${name} `);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredMembers = Object.entries(memberNames).filter(
    ([, name]) => name.toLowerCase().includes(mentionFilter)
  );

  const handleSubmit = async () => {
    if (!user || (!newComment.trim() && !file)) return;
    setLoading(true);

    let attachmentUrl: string | null = null;
    if (file) {
      const path = `${taskId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("task-attachments").upload(path, file);
      if (uploadErr) { toast.error(t("failedToUpload")); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from("task-attachments").getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
    }

    // Check for @mentions and send notifications
    const mentions = newComment.match(/@(\S+)/g) || [];
    const mentionedUserIds = mentions.map(m => {
      const name = m.slice(1);
      return Object.entries(memberNames).find(([, n]) => n === name)?.[0];
    }).filter(Boolean) as string[];

    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      content: newComment.trim() || (file ? file.name : ""),
      attachment_url: attachmentUrl,
      parent_id: replyTo?.id || null,
    } as any);

    if (!error && mentionedUserIds.length > 0) {
      const senderName = memberNames[user.id] || "Someone";
      await Promise.all(mentionedUserIds.filter(id => id !== user.id).map(uid =>
        supabase.from("notifications").insert({
          user_id: uid,
          type: "mention",
          title: lang === "ar" ? "تمت الإشارة إليك" : "You were mentioned",
          message: `${senderName}: ${newComment.slice(0, 80)}`,
          link: "/tasks",
        } as any)
      ));
    }

    setLoading(false);
    if (error) { toast.error(t("failedToComment")); return; }
    setNewComment("");
    setFile(null);
    setReplyTo(null);
    loadComments();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("task_comments").delete().eq("id", id);
    loadComments();
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const renderComment = (c: Comment, isReply = false) => {
    const name = memberNames[c.user_id] || c.user_id.slice(0, 8);
    const initials = name.split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
    const childReplies = replies(c.id);

    // Highlight @mentions
    const renderContent = (text: string) => {
      const parts = text.split(/(@\S+)/g);
      return parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="text-primary font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    };

    return (
      <div key={c.id} className={`${isReply ? "ms-6 border-s-2 border-border/20 ps-3" : ""}`}>
        <div className="flex gap-2 group">
          <Avatar className="h-6 w-6 shrink-0 mt-0.5">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{name}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
              </span>
              <button onClick={() => setReplyTo(c)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Reply className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </button>
              {c.user_id === user?.id && (
                <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
            <p className="text-xs text-foreground/80 break-words">{renderContent(c.content)}</p>
            {c.attachment_url && (
              <a href={c.attachment_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-0.5">
                <Download className="h-3 w-3" /> {t("attachment")}
              </a>
            )}
          </div>
        </div>
        {childReplies.map(r => renderComment(r, true))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground">{t("comments")} ({comments.length})</h4>
      
      <div className="max-h-48 overflow-y-auto space-y-2">
        {topLevel.map(c => renderComment(c))}
      </div>

      {replyTo && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-card/50 px-2 py-1 rounded">
          <Reply className="h-3 w-3" />
          <span>{lang === "ar" ? "رد على" : "Replying to"} {memberNames[replyTo.user_id] || "..."}</span>
          <button onClick={() => setReplyTo(null)} className="ms-auto text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={t("writeComment")}
              rows={1}
              className="text-xs bg-background/50 border-border/50 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
            {showMentions && filteredMembers.length > 0 && (
              <div className="absolute bottom-full mb-1 start-0 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto">
                {filteredMembers.map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => insertMention(name)}
                    className="w-full text-start px-3 py-1.5 text-xs hover:bg-accent/50 flex items-center gap-2"
                  >
                    <AtSign className="h-3 w-3 text-primary" />
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
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
      </div>
      {file && <p className="text-[10px] text-muted-foreground">📎 {file.name}</p>}
    </div>
  );
};

export default TaskComments;
