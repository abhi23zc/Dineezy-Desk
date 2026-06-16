"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskAssignee = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type Task = {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  created_at: string;
  assignees: TaskAssignee[];
};

export type TaskStats = {
  total: number;
  inProgress: number;
  completed: number;
  unassigned: number;
  overdue: number;
  progressPercent: number;
};

type UseTasksResult = {
  tasks: Task[];
  stats: TaskStats;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskDescription: (taskId: string, description: string) => void;
  updateTaskTitle: (taskId: string, title: string) => Promise<void>;
  updateTaskPriority: (taskId: string, priority: TaskPriority) => Promise<void>;
  updateTaskDueDate: (taskId: string, dueDate: string | null) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignUser: (taskId: string, assignee: TaskAssignee) => Promise<void>;
  unassignUser: (taskId: string, userId: string) => Promise<void>;
};

// ── Status cycle ──────────────────────────────────────────────────────────────
const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress", in_progress: "review", review: "done", done: "todo", blocked: "todo",
};
export function cycleStatus(current: TaskStatus): TaskStatus { return STATUS_CYCLE[current]; }

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTasks(collectionIds: string[]): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collectionKey = collectionIds.slice().sort().join(",");

  const fetchTasks = useCallback(async () => {
    if (collectionIds.length === 0) { setTasks([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await superbase
        .from("tasks")
        .select(`
          id, collection_id, title, description,
          status, priority, due_date, position, created_at,
          task_assignees (
            user_id,
            profiles ( full_name, avatar_url )
          )
        `)
        .in("collection_id", collectionIds)
        .order("position", { ascending: true });
      if (fetchError) throw new Error(fetchError.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shaped: Task[] = (data ?? []).map((row: any) => ({
        id: row.id,
        collection_id: row.collection_id,
        title: row.title,
        description: row.description,
        status: row.status as TaskStatus,
        priority: row.priority as TaskPriority,
        due_date: row.due_date,
        position: row.position,
        created_at: row.created_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assignees: (row.task_assignees ?? []).map((a: any): TaskAssignee => ({
          user_id: a.user_id,
          full_name: a.profiles?.full_name ?? null,
          avatar_url: a.profiles?.avatar_url ?? null,
        })),
      }));
      setTasks(shaped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionKey]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats = useMemo<TaskStats>(() => {
    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const unassigned = tasks.filter((t) => t.assignees.length === 0).length;
    const overdue = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status !== "done"
    ).length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, inProgress, completed, unassigned, overdue, progressPercent };
  }, [tasks]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const patch = useCallback((taskId: string, changes: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...changes } : t));
  }, []);

  // ── Existing mutations ────────────────────────────────────────────────────
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    patch(taskId, { status: newStatus });
    const { error: updateError } = await superbase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (updateError) patch(taskId, { status: cycleStatus(newStatus) });
  }, [patch]);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  const updateTaskDescription = useCallback(async (taskId: string, description: string) => {
    const trimmed = description.trim() || null;
    patch(taskId, { description: trimmed });
    await superbase
      .from("tasks")
      .update({ description: trimmed, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  }, [patch]);

  // ── New mutations ─────────────────────────────────────────────────────────
  const updateTaskTitle = useCallback(async (taskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    patch(taskId, { title: trimmed });
    await superbase
      .from("tasks")
      .update({ title: trimmed, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  }, [patch]);

  const updateTaskPriority = useCallback(async (taskId: string, priority: TaskPriority) => {
    patch(taskId, { priority });
    await superbase
      .from("tasks")
      .update({ priority, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  }, [patch]);

  const updateTaskDueDate = useCallback(async (taskId: string, dueDate: string | null) => {
    patch(taskId, { due_date: dueDate });
    await superbase
      .from("tasks")
      .update({ due_date: dueDate, updated_at: new Date().toISOString() })
      .eq("id", taskId);
  }, [patch]);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await superbase.from("tasks").delete().eq("id", taskId);
  }, []);

  const assignUser = useCallback(async (taskId: string, assignee: TaskAssignee) => {
    // Optimistic: add assignee
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, assignees: [...t.assignees, assignee] } : t
    ));
    const { error: insertError } = await superbase
      .from("task_assignees")
      .insert({ task_id: taskId, user_id: assignee.user_id });
    // Rollback on failure
    if (insertError) {
      setTasks((prev) => prev.map((t) =>
        t.id === taskId
          ? { ...t, assignees: t.assignees.filter((a) => a.user_id !== assignee.user_id) }
          : t
      ));
    }
  }, []);

  const unassignUser = useCallback(async (taskId: string, userId: string) => {
    // Optimistic: remove assignee
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, assignees: t.assignees.filter((a) => a.user_id !== userId) } : t
    ));
    await superbase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", userId);
  }, []);

  return {
    tasks, stats, loading, error, refetch: fetchTasks, addTask,
    updateTaskStatus, updateTaskDescription,
    updateTaskTitle, updateTaskPriority, updateTaskDueDate,
    deleteTask, assignUser, unassignUser,
  };
}
