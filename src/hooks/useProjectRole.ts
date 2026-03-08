import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export const useProjectRole = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const [role, setRole] = useState<ProjectRole>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) {
      setRole("viewer");
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);

      // Check if owner
      const { data: project } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single();

      if (project?.owner_id === user.id) {
        setRole("owner");
        setLoading(false);
        return;
      }

      // Check project_members role
      const { data: membership } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single();

      if (membership?.role) {
        setRole(membership.role as ProjectRole);
      } else {
        setRole("viewer");
      }
      setLoading(false);
    };

    fetchRole();
  }, [user, projectId]);

  const canEdit = role === "owner" || role === "admin" || role === "member";
  const canManage = role === "owner" || role === "admin";
  const canDelete = role === "owner";
  const isViewer = role === "viewer";

  return { role, loading, canEdit, canManage, canDelete, isViewer };
};
