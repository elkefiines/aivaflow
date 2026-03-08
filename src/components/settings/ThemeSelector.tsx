import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const THEMES = [
  {
    id: "default",
    nameEn: "Default (Dark Blue)",
    nameAr: "الافتراضي (أزرق داكن)",
    primary: "233 90% 47%",
    background: "240 60% 3%",
    card: "230 50% 9%",
  },
  {
    id: "ocean",
    nameEn: "Ocean",
    nameAr: "المحيط",
    primary: "195 90% 45%",
    background: "200 50% 4%",
    card: "200 40% 10%",
  },
  {
    id: "forest",
    nameEn: "Forest",
    nameAr: "الغابة",
    primary: "150 70% 40%",
    background: "160 40% 4%",
    card: "155 35% 10%",
  },
  {
    id: "sunset",
    nameEn: "Sunset",
    nameAr: "الغروب",
    primary: "20 90% 55%",
    background: "15 40% 4%",
    card: "15 35% 10%",
  },
  {
    id: "purple",
    nameEn: "Amethyst",
    nameAr: "الجمشت",
    primary: "270 80% 55%",
    background: "275 50% 4%",
    card: "270 40% 10%",
  },
  {
    id: "rose",
    nameEn: "Rose",
    nameAr: "الوردي",
    primary: "340 80% 55%",
    background: "340 40% 4%",
    card: "340 35% 10%",
  },
];

export const applyTheme = (themeId: string) => {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("--sidebar-primary", theme.primary);
  root.style.setProperty("--sidebar-ring", theme.primary);
  // Only apply dark bg if not in light mode
  if (!root.classList.contains("light")) {
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--card", theme.card);
    root.style.setProperty("--popover", theme.card);
    root.style.setProperty("--sidebar-background", theme.card);
  }
};

export const loadUserTheme = async (userId: string) => {
  const { data } = await supabase.from("profiles").select("theme").eq("user_id", userId).single();
  if (data?.theme && data.theme !== "default") {
    applyTheme(data.theme);
  }
};

const ThemeSelector = () => {
  const { user } = useAuth();
  const { lang, dir } = useLanguage();
  const isAr = lang === "ar";
  const [activeTheme, setActiveTheme] = useState("default");

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("theme").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.theme) {
          setActiveTheme(data.theme);
          applyTheme(data.theme);
        }
      });
  }, [user?.id]);

  const selectTheme = async (themeId: string) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    if (user?.id) {
      await supabase.from("profiles").update({ theme: themeId } as any).eq("user_id", user.id);
    }
    toast.success(isAr ? "تم تغيير السمة" : "Theme applied");
  };

  return (
    <div className="space-y-4" dir={dir}>
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">{isAr ? "سمة الألوان" : "Color Theme"}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map(theme => (
          <motion.button
            key={theme.id}
            onClick={() => selectTheme(theme.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-4 rounded-xl border-2 transition-all ${activeTheme === theme.id ? "border-primary glow-blue-sm" : "border-border/20 hover:border-border/40"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${theme.primary})` }} />
              <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${theme.background})` }} />
              <div className="w-4 h-4 rounded-full" style={{ background: `hsl(${theme.card})` }} />
            </div>
            <p className="text-xs text-foreground text-start">{isAr ? theme.nameAr : theme.nameEn}</p>
            {activeTheme === theme.id && (
              <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
