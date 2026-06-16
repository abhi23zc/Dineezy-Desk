"use client";

import { useCallback, useEffect, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type WorkspaceMember = {
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

type UseWorkspaceMembersResult = {
  members: WorkspaceMember[];
  loading: boolean;
  refetch: () => void;
  removeMember: (userId: string) => Promise<void>;
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useWorkspaceMembers(workspaceId: string | null | undefined): UseWorkspaceMembersResult {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) { setMembers([]); return; }

    setLoading(true);
    try {
      const { data } = await superbase
        .from("workspace_members")
        .select(`
          user_id, role,
          profiles ( full_name, avatar_url, email )
        `)
        .eq("workspace_id", workspaceId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMembers((data ?? []).map((row: any): WorkspaceMember => ({
        user_id: row.user_id,
        role: row.role,
        full_name: row.profiles?.full_name ?? null,
        avatar_url: row.profiles?.avatar_url ?? null,
        email: row.profiles?.email ?? null,
      })));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const removeMember = useCallback(async (userId: string) => {
    if (!workspaceId) return;
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    const { error } = await superbase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) fetchMembers();
  }, [workspaceId, fetchMembers]);

  return { members, loading, refetch: fetchMembers, removeMember };
}
