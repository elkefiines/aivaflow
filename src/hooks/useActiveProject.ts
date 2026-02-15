import { useEffect, useState, useCallback } from "react";

export const useActiveProject = () => {
  const [projectId, setProjectId] = useState<string | null>(() => localStorage.getItem("active_project_id"));

  const handleChange = useCallback((e: Event) => {
    const id = (e as CustomEvent).detail;
    setProjectId(id);
  }, []);

  useEffect(() => {
    window.addEventListener("project-changed", handleChange);
    return () => window.removeEventListener("project-changed", handleChange);
  }, [handleChange]);

  return { projectId, setProjectId };
};
