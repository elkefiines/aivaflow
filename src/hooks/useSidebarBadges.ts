import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";

export const useSidebarBadges = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);

  const load = async () => {
    if (!user || !projectId) return;

    const [msgsRes, tasksRes] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .neq("sender_id", user.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("assignee_id", user.id)
        .in("status", ["todo", "in_progress"]),
    ]);

    setUnreadMessages(msgsRes.count || 0);
    setPendingTasks(tasksRes.count || 0);
  };

  useEffect(() => {
    load();
    if (!projectId) return;

    const channel = supabase
      .channel(`sidebar-badges-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, projectId]);

  return { unreadMessages, pendingTasks };
};
