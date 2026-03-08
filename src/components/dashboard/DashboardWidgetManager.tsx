import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings2, GripVertical, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ALL_WIDGETS = [
  { id: "statusBars", labelEn: "Status Bars", labelAr: "أشرطة الحالة" },
  { id: "stats", labelEn: "Statistics", labelAr: "الإحصائيات" },
  { id: "summary", labelEn: "Summary", labelAr: "الملخص" },
  { id: "chart", labelEn: "Task Completion Chart", labelAr: "مخطط إكمال المهام" },
  { id: "aiInsights", labelEn: "AI Insights", labelAr: "رؤى الذكاء الاصطناعي" },
  { id: "recentTasks", labelEn: "Recent Tasks", labelAr: "المهام الأخيرة" },
  { id: "team", labelEn: "Team", labelAr: "الفريق" },
  { id: "activity", labelEn: "Activity Log", labelAr: "سجل النشاطات" },
];

const DEFAULT_WIDGETS = ["statusBars", "stats", "summary", "chart", "aiInsights", "recentTasks", "team", "activity"];

export const useDashboardWidgets = () => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("dashboard_widgets").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.dashboard_widgets && Array.isArray(data.dashboard_widgets)) {
          setWidgets(data.dashboard_widgets as string[]);
        }
        setLoaded(true);
      });
  }, [user?.id]);

  const saveWidgets = async (newWidgets: string[]) => {
    setWidgets(newWidgets);
    if (user?.id) {
      await supabase.from("profiles").update({ dashboard_widgets: newWidgets as any }).eq("user_id", user.id);
    }
  };

  return { widgets, saveWidgets, loaded };
};

interface Props {
  widgets: string[];
  onSave: (widgets: string[]) => void;
}

const DashboardWidgetManager = ({ widgets, onSave }: Props) => {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<string[]>(widgets);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => { setLocalWidgets(widgets); }, [widgets]);

  const toggle = (id: string) => {
    setLocalWidgets(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...localWidgets];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setLocalWidgets(arr);
  };

  const handleSave = () => {
    onSave(localWidgets);
    setOpen(false);
    toast.success(lang === "ar" ? "تم حفظ التفضيلات" : "Preferences saved");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {lang === "ar" ? "تخصيص لوحة التحكم" : "Customize Dashboard"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {ALL_WIDGETS.map((w, i) => {
            const enabled = localWidgets.includes(w.id);
            const orderIdx = localWidgets.indexOf(w.id);
            return (
              <div key={w.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/20">
                <button onClick={() => orderIdx > 0 && moveUp(orderIdx)} className="text-muted-foreground hover:text-foreground cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="flex-1 text-sm text-foreground">
                  {lang === "ar" ? w.labelAr : w.labelEn}
                </span>
                <Switch checked={enabled} onCheckedChange={() => toggle(w.id)} />
              </div>
            );
          })}
        </div>
        <Button onClick={handleSave} className="w-full mt-2">
          {lang === "ar" ? "حفظ" : "Save"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardWidgetManager;
