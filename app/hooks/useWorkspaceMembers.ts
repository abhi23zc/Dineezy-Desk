"use client";

import { useCallback, useEffect, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type WorkspaceMember = {
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

type UseWorkspaceMembersResult = {
  members: WorkspaceMember[];
  loading: boolean;
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
          profiles ( full_name, avatar_url )
        `)
        .eq("workspace_id", workspaceId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMembers((data ?? []).map((row: any): WorkspaceMember => ({
        user_id: row.user_id,
        role: row.role,
        full_name: row.profiles?.full_name ?? null,
        avatar_url: row.profiles?.avatar_url ?? null,
      })));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, loading };
}
