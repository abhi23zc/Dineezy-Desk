"use client";

import { useCallback, useEffect, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ────────────────────────────────────────────────────────────────────
export type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string | null;
  created_at: string;
  member_count: number; // fetched via nested count in the same query
};

type UseWorkspacesResult = {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  setActiveWorkspace: (ws: WorkspaceItem) => void;
  /** Append a newly created workspace and switch to it */
  addWorkspace: (ws: WorkspaceItem) => void;
  loading: boolean;
  error: string | null;
  /** Manually re-fetch (e.g. after an error) */
  refetch: () => void;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useWorkspaces(): UseWorkspacesResult {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await superbase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await superbase
        .from("workspace_members")
        .select(`
          joined_at,
          workspaces (
            id,
            name,
            slug,
            emoji,
            description,
            created_at,
            workspace_members ( count )
          )
        `)
        .eq("user_id", session.user.id)
        .order("joined_at", { ascending: true });

      if (fetchError) throw new Error(fetchError.message);

      // Flatten the nested join result and extract the member count.
      const items: WorkspaceItem[] = (data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => {
          const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
          if (!ws || typeof ws.id !== "string") return null;

          // Supabase returns count as [{ count: number }]
          const countRow = Array.isArray(ws.workspace_members)
            ? ws.workspace_members[0]
            : null;
          const member_count: number = countRow?.count ?? 0;

          return {
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            emoji: ws.emoji ?? "🏢",
            description: ws.description ?? null,
            created_at: ws.created_at,
            member_count,
          } satisfies WorkspaceItem;
        })
        .filter((ws): ws is WorkspaceItem => ws !== null);

      setWorkspaces(items);
      // Auto-select the first workspace if none is active yet
      setActiveWorkspace((prev) => prev ?? items[0] ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load workspaces.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const addWorkspace = useCallback((ws: WorkspaceItem) => {
    setWorkspaces((prev) => [...prev, ws]);
    setActiveWorkspace(ws);
  }, []);

  return {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    addWorkspace,
    loading,
    error,
    refetch: fetchWorkspaces,
  };
}
