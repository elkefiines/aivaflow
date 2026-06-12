import { FolderKanban } from "lucide-react";

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
      <FolderKanban className="relative h-10 w-10 text-primary animate-pulse" />
    </div>
    <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

export default PageLoader;
