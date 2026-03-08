import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ThemeToggle = () => {
  const { t } = useLanguage();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("aiva-theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("aiva-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={toggle}>
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{theme === "dark" ? t("lightMode") || "Light Mode" : t("darkMode") || "Dark Mode"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
