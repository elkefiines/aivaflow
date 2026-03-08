import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Theme = "dark" | "light" | "system";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const ThemeToggle = () => {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("aiva-theme") as Theme) || "system";
    }
    return "system";
  });

  const applyTheme = useCallback((resolved: "dark" | "light") => {
    const root = document.documentElement;
    // Enable transition
    root.classList.add("theme-transitioning");
    if (resolved === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    // Remove transition class after animation
    setTimeout(() => root.classList.remove("theme-transitioning"), 500);
  }, []);

  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    localStorage.setItem("aiva-theme", theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const resolved = theme === "system" ? getSystemTheme() : theme;

  const icon =
    theme === "system" ? <Monitor className="h-4 w-4 text-muted-foreground" /> :
    theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> :
    <Moon className="h-4 w-4 text-primary" />;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              {icon}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {theme === "system"
              ? (isRtl ? "تلقائي (النظام)" : "Auto (System)")
              : theme === "dark"
              ? (t("lightMode") || "Light Mode")
              : (t("darkMode") || "Dark Mode")}
          </p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={isRtl ? "start" : "end"} className="min-w-[140px]">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
          <Sun className="h-4 w-4" />
          {isRtl ? "فاتح" : "Light"}
          {theme === "light" && <span className="ms-auto text-primary">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
          <Moon className="h-4 w-4" />
          {isRtl ? "داكن" : "Dark"}
          {theme === "dark" && <span className="ms-auto text-primary">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
          <Monitor className="h-4 w-4" />
          {isRtl ? "تلقائي" : "System"}
          {theme === "system" && <span className="ms-auto text-primary">●</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
