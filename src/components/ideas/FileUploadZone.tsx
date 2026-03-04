import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadZoneProps {
  projectId: string;
  onComplete: () => void;
}

const FileUploadZone = ({ projectId, onComplete }: FileUploadZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const allowedTypes = ["text/plain", "text/csv", "text/markdown", "application/json"];
    const allowedExts = [".txt", ".csv", ".md", ".json"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      toast.error("Only TXT, CSV, MD, and JSON files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }

    setUploading(true);
    setFileName(file.name);

    const filePath = `${projectId}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("project-files").upload(filePath, file);
    if (uploadErr) {
      toast.error("Upload failed");
      setUploading(false);
      setFileName(null);
      return;
    }

    const { error: fnErr } = await supabase.functions.invoke("analyze-file", {
      body: { file_path: filePath, project_id: projectId },
    });

    if (fnErr) {
      toast.error("File analysis failed");
    } else {
      toast.success("File analyzed – tasks extracted!");
      onComplete();
    }

    setUploading(false);
    setFileName(null);
  }, [projectId, onComplete]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
        dragging ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/40"
      }`}
    >
      <input
        type="file"
        accept=".txt,.csv,.md,.json"
        onChange={onInputChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={uploading}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Analyzing {fileName}…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-foreground font-medium">Drop a file or click to upload</p>
          <p className="text-xs text-muted-foreground">TXT, CSV, MD, JSON — max 5 MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
