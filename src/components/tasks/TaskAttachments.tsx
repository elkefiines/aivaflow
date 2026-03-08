import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, Trash2, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

const TaskAttachments = ({ taskId }: { taskId: string }) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from("attachments" as any)
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    setAttachments((data as any) || []);
  };

  useEffect(() => { fetchAttachments(); }, [taskId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isRtl ? "حجم الملف كبير جداً (الحد 10 ميجا)" : "File too large (max 10MB)");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${taskId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("task-attachments").upload(path, file);
    if (uploadError) {
      toast.error(isRtl ? "فشل رفع الملف" : "Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("task-attachments").getPublicUrl(path);
    await (supabase.from("attachments" as any) as any).insert({
      task_id: taskId,
      uploaded_by: user.id,
      file_name: file.name,
      file_url: urlData.publicUrl || path,
      file_size: file.size,
      file_type: file.type,
    });
    toast.success(isRtl ? "تم رفع الملف" : "File uploaded");
    setUploading(false);
    fetchAttachments();
  };

  const handleDelete = async (att: Attachment) => {
    await (supabase.from("attachments" as any) as any).delete().eq("id", att.id);
    toast.success(isRtl ? "تم حذف الملف" : "File deleted");
    fetchAttachments();
  };

  const getIcon = (type: string | null) => {
    if (type?.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
    if (type?.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1">
          <Paperclip className="h-4 w-4" />
          {isRtl ? "المرفقات" : "Attachments"} ({attachments.length})
        </h4>
        <label>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          <Button variant="ghost" size="sm" asChild disabled={uploading}>
            <span className="cursor-pointer">
              <Upload className="h-3 w-3 mr-1" />
              {uploading ? (isRtl ? "جارٍ الرفع..." : "Uploading...") : (isRtl ? "رفع" : "Upload")}
            </span>
          </Button>
        </label>
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm group">
              {getIcon(att.file_type)}
              <a href={att.file_url} target="_blank" rel="noopener" className="flex-1 truncate hover:underline text-foreground">
                {att.file_name}
              </a>
              <span className="text-xs text-muted-foreground">{formatSize(att.file_size)}</span>
              {att.uploaded_by === user?.id && (
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDelete(att)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskAttachments;
