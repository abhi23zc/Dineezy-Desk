"use client";

import { useCallback, useEffect, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ────────────────────────────────────────────────────────────────────
export type ProjectItem = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string | null;
  status: "active" | "archived" | "completed";
  created_by: string;
  created_at: string;
};

type UseProjectsResult = {
  projects: ProjectItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addProject: (project: ProjectItem) => void;
  updateProject: (id: string, fields: { name?: string; emoji?: string; color?: string | null; description?: string; status?: ProjectItem["status"] }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useProjects(workspaceId: string | null | undefined): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    // Don't fetch if no workspace is selected
    if (!workspaceId) {
      setProjects([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await superbase
        .from("projects")
        .select("id, workspace_id, name, description, emoji, color, status, created_by, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (fetchError) throw new Error(fetchError.message);

      setProjects((data ?? []) as ProjectItem[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load projects.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Re-fetch whenever the active workspace changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback((project: ProjectItem) => {
    setProjects((prev) => [...prev, project]);
  }, []);

  const updateProject = useCallback(async (id: string, fields: { name?: string; emoji?: string; color?: string | null; description?: string; status?: ProjectItem["status"] }) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...fields } : p));
    const { error: updateError } = await superbase
      .from("projects")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) fetchProjects();
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    const { error: delError } = await superbase.from("projects").delete().eq("id", id);
    if (delError) fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects, addProject, updateProject, deleteProject };
}
