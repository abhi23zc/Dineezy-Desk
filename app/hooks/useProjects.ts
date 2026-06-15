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

  return { projects, loading, error, refetch: fetchProjects, addProject };
}
