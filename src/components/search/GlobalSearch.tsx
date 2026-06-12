import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, CheckSquare, Lightbulb, MessageSquare, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const RECENT_KEY = "aiva.search.recent";
const loadRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5);
  } catch {
    return [];
  }
};
const saveRecent = (q: string) => {
  const cur = loadRecent().filter((s) => s !== q);
  const next = [q, ...cur].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};

interface SearchResult {
  id: string;
  title: string;
  type: "task" | "idea" | "message";
  subtitle?: string;
  route: string;
}

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const { t, dir, lang } = useLanguage();
  const { projectId } = useActiveProject();
  const navigate = useNavigate();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!projectId || !q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const term = `%${q.trim()}%`;

      const [tasksRes, ideasRes, messagesRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, description, status")
          .eq("project_id", projectId)
          .or(`title.ilike.${term},description.ilike.${term}`)
          .limit(5),
        supabase
          .from("ideas")
          .select("id, raw_text, ai_summary")
          .eq("project_id", projectId)
          .or(`raw_text.ilike.${term},ai_summary.ilike.${term}`)
          .limit(5),
        supabase
          .from("messages")
          .select("id, content")
          .eq("project_id", projectId)
          .ilike("content", term)
          .limit(5),
      ]);

      const items: SearchResult[] = [];

      tasksRes.data?.forEach((t) =>
        items.push({
          id: t.id,
          title: t.title,
          type: "task",
          subtitle: t.status || undefined,
          route: "/tasks",
        })
      );

      ideasRes.data?.forEach((i) =>
        items.push({
          id: i.id,
          title: (i.ai_summary || i.raw_text).slice(0, 80),
          type: "idea",
          route: "/ideas",
        })
      );

      messagesRes.data?.forEach((m) =>
        items.push({
          id: m.id,
          title: m.content.slice(0, 80),
          type: "message",
          route: "/messages",
        })
      );

      setResults(items);
      setLoading(false);
    },
    [projectId]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    if (query.trim()) {
      saveRecent(query.trim());
      setRecent(loadRecent());
    }
    setOpen(false);
    setQuery("");
    navigate(result.route);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  const iconMap = {
    task: CheckSquare,
    idea: Lightbulb,
    message: MessageSquare,
  };

  const typeLabels = {
    task: t("tasks"),
    idea: t("ideas"),
    message: t("messages"),
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 h-8 px-3 text-muted-foreground border-border/40 bg-background/50"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">{t("globalSearch")}</span>
        <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="sm:hidden h-8 w-8"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t("searchPlaceholder")}
          value={query}
          onValueChange={setQuery}
          dir={dir}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? t("searching") : t("noResults")}
          </CommandEmpty>
          {!query.trim() && recent.length > 0 && (
            <CommandGroup
              heading={
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {lang === "ar" ? "بحوث سابقة" : "Recent"}
                  </span>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {lang === "ar" ? "مسح" : "Clear"}
                  </button>
                </div>
              }
            >
              {recent.map((q) => (
                <CommandItem key={q} onSelect={() => setQuery(q)} className="gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{q}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {(["task", "idea", "message"] as const).map((type) => {
            const group = results.filter((r) => r.type === type);
            if (group.length === 0) return null;
            const Icon = iconMap[type];
            return (
              <CommandGroup key={type} heading={typeLabels[type]}>
                {group.map((r) => (
                  <CommandItem
                    key={r.id}
                    onSelect={() => handleSelect(r)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{r.title}</span>
                    {r.subtitle && (
                      <span className="ms-auto text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;

export default GlobalSearch;
