import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SHORTCUTS: Record<string, string> = {
  "n": "/tasks",      // New task (navigate to tasks)
  "d": "/dashboard",  // Dashboard
  "g": "/gantt",      // Gantt
  "c": "/calendar",   // Calendar
  "m": "/messages",   // Messages
  "s": "/settings",   // Settings
  "f": "/focus",      // Focus mode
};

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const route = SHORTCUTS[e.key.toLowerCase()];
    if (route) {
      e.preventDefault();
      navigate(route);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export const SHORTCUT_LIST = Object.entries(SHORTCUTS).map(([key, route]) => ({
  key: key.toUpperCase(),
  route,
  label: route.replace("/", "").replace("-", " "),
}));
