"use client";

/**
 * useAttachments Hook
 * Manages attachments for a specific task with CRUD operations
 */

import { useCallback, useEffect, useState } from "react";
import { superbase } from "../../utils/supabase_client";

// ── Types ────────────────────────────────────────────────────────────────────

export type Attachment = {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  // Joined data
  uploaded_by_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type AttachmentInput = {
  file: File;
  filePath: string;
  mimeType: string;
};

type UseAttachmentsResult = {
  attachments: Attachment[];
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;
  uploadError: string | null;
  deleteError: string | null;
  refetch: () => void;
  uploadAttachment: (file: File) => Promise<void>;
  uploadAttachments: (files: File[]) => Promise<void>;
  deleteAttachment: (attachment: Attachment) => Promise<void>;
  generateDownloadUrl: (attachment: Attachment) => Promise<string>;
  clearErrors: () => void;
};

// ── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    // Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    // Documents
    "application/pdf", "text/plain", "text/markdown",
    // Office
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Code
    "application/json", "text/javascript", "text/css", "text/html",
    // Archives
    "application/zip", "application/x-7z-compressed",
  ],
};

// ── Helper Functions ─────────────────────────────────────────────────────────

function generateFilePath(taskId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `tasks/${taskId}/${timestamp}-${sanitizedFileName}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(CONFIG.maxFileSize)} limit`,
    };
  }

  if (!CONFIG.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not allowed. Allowed: images, PDFs, documents, code files, archives",
    };
  }

  return { valid: true };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAttachments(taskId: string | null | undefined): UseAttachmentsResult {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch attachments for task
  const fetchAttachments = useCallback(async () => {
    if (!taskId) {
      setAttachments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await superbase
        .from("attachments")
        .select(`
          id, task_id, uploaded_by, file_name, file_path, file_size, mime_type, created_at,
          profiles:uploaded_by (full_name, avatar_url)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (fetchError) throw new Error(fetchError.message);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shaped: Attachment[] = (data ?? []).map((row: any) => ({
        id: row.id,
        task_id: row.task_id,
        uploaded_by: row.uploaded_by,
        file_name: row.file_name,
        file_path: row.file_path,
        file_size: row.file_size,
        mime_type: row.mime_type,
        created_at: row.created_at,
        uploaded_by_profile: row.profiles ? {
          full_name: row.profiles.full_name,
          avatar_url: row.profiles.avatar_url,
        } : undefined,
      }));

      setAttachments(shaped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load attachments";
      setError(message || null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Fetch on mount and when taskId changes
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadSingleAttachment = useCallback(async (
    file: File,
    accessToken: string,
    user: {
      id: string;
      user_metadata?: {
        full_name?: string | null;
        avatar_url?: string | null;
      };
    }
  ): Promise<Attachment> => {
    if (!taskId) {
      throw new Error("No task selected");
    }

    const filePath = generateFilePath(taskId, file.name);

    const presignResponse = await fetch("/api/attachments/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        filePath,
        mimeType: file.type,
        operation: "upload",
      }),
    });

    if (!presignResponse.ok) {
      throw new Error(await readErrorMessage(presignResponse, "Failed to get upload URL"));
    }

    const { url } = await presignResponse.json() as { url: string };

    const uploadResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    const { data: attachment, error: insertError } = await superbase
      .from("attachments")
      .insert({
        task_id: taskId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select("*")
      .single();

    if (insertError) {
      await fetch("/api/attachments/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ filePath }),
      });
      throw new Error(insertError.message);
    }

    return {
      ...attachment,
      uploaded_by_profile: {
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
    } as Attachment;
  }, [taskId]);

  // Upload attachment
  const uploadAttachment = useCallback(async (file: File) => {
    await uploadAttachments([file]);
  }, []);

  const uploadAttachments = useCallback(async (files: File[]) => {
    if (!taskId) {
      setUploadError("No task selected");
      return;
    }

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const { data: { session } } = await superbase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const uploadedAttachments: Attachment[] = [];
      const failures: string[] = [];

      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          failures.push(`${file.name}: ${validation.error || "File validation failed"}`);
          continue;
        }

        try {
          const attachment = await uploadSingleAttachment(file, session.access_token, session.user);
          uploadedAttachments.push(attachment);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to upload attachment";
          failures.push(`${file.name}: ${message}`);
        }
      }

      if (uploadedAttachments.length > 0) {
        setAttachments((prev) => [...uploadedAttachments, ...prev]);
      }

      if (failures.length > 0) {
        setUploadError(failures.join(" | "));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload attachment";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }, [taskId, uploadSingleAttachment]);

  // Delete attachment
  const deleteAttachment = useCallback(async (attachment: Attachment) => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const { data: { session } } = await superbase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Step 1: Delete from R2 storage
      const deleteResponse = await fetch("/api/attachments/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filePath: attachment.file_path }),
      });

      if (!deleteResponse.ok) {
        console.warn(await readErrorMessage(deleteResponse, "Failed to delete file from storage"));
      }

      // Step 2: Delete from database
      const { error: deleteError } = await superbase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);

      if (deleteError) throw new Error(deleteError.message);

      // Remove from local state
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete attachment";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }, []);

  // Generate download URL for attachment
  const generateDownloadUrl = useCallback(async (attachment: Attachment): Promise<string> => {
    const { data: { session } } = await superbase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await fetch("/api/attachments/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        filePath: attachment.file_path,
        mimeType: attachment.mime_type,
        operation: "download",
        fileName: attachment.file_name,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to generate download URL"));
    }

    const { url } = await response.json();
    return url;
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(null);
    setUploadError(null);
    setDeleteError(null);
  }, []);

  return {
    attachments,
    loading,
    uploading,
    deleting,
    error,
    uploadError,
    deleteError,
    refetch: fetchAttachments,
    uploadAttachment,
    uploadAttachments,
    deleteAttachment,
    generateDownloadUrl,
    clearErrors,
  };
}

// Re-export utilities for use in components
export { formatFileSize, validateFile };

// Export getFileIcon with proper typing
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "powerpoint";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType.includes("json") || mimeType.includes("javascript")) return "code";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "archive";
  return "file";
}
