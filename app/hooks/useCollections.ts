"use client";

import { useCallback, useEffect, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Collection = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
};

type UseCollectionsResult = {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addCollection: (c: Collection) => void;
  updateCollectionName: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useCollections(projectId: string | null | undefined): UseCollectionsResult {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!projectId) { setCollections([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await superbase
        .from("collections")
        .select("id, project_id, name, description, position, created_at")
        .eq("project_id", projectId)
        .order("position", { ascending: true });
      if (fetchError) throw new Error(fetchError.message);
      setCollections((data ?? []) as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const addCollection = useCallback((c: Collection) => {
    setCollections((prev) => [...prev, c]);
  }, []);

  // ── Optimistic rename ──────────────────────────────────────────────────────
  const updateCollectionName = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCollections((prev) => prev.map((c) => c.id === id ? { ...c, name: trimmed } : c));
    const { error: updateError } = await superbase
      .from("collections")
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) fetchCollections(); // rollback on failure
  }, [fetchCollections]);

  // ── Optimistic delete (DB ON DELETE CASCADE removes child tasks) ───────────
  const deleteCollection = useCallback(async (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    const { error: deleteError } = await superbase
      .from("collections")
      .delete()
      .eq("id", id);
    if (deleteError) fetchCollections(); // rollback on failure
  }, [fetchCollections]);

  return { collections, loading, error, refetch: fetchCollections, addCollection, updateCollectionName, deleteCollection };
}
