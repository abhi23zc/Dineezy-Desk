"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { superbase } from "../../utils/supabase_client";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emoji: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the newly created workspace so the parent can switch to it */
  onCreated: (workspace: Workspace) => void;
}

// ─── Emoji picker data ───────────────────────────────────────────────────────
const EMOJI_OPTIONS = [
  "🏢", "🚀", "⚡", "🎯", "💡", "🔥", "🌟", "🎨",
  "🛠️", "📊", "🧩", "🌍", "🏆", "🎮", "💼", "🔬",
  "🍕", "🎵", "🏄", "🌿", "🦋", "🐉", "💎", "🌈",
  "👤", "👥", "🤝", "📱", "💻", "🖥️", "📝", "📌",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreated,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🏢");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Auto-focus name on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSlug("");
      setSlugManuallyEdited(false);
      setDescription("");
      setEmoji("🏢");
      setEmojiPickerOpen(false);
      setError(null);
      setSlugError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Auto-derive slug from name (unless user has manually edited it)
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(toSlug(name));
    }
  }, [name, slugManuallyEdited]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Validate slug format
  const validateSlug = useCallback((value: string) => {
    if (!value) {
      setSlugError("Slug is required.");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed.");
      return false;
    }
    setSlugError(null);
    return true;
  }, []);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    validateSlug(cleaned);
  };

  // Reset slug to auto-derived
  const handleSlugReset = () => {
    setSlugManuallyEdited(false);
    const derived = toSlug(name);
    setSlug(derived);
    validateSlug(derived);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }
    if (!validateSlug(slug)) return;

    setLoading(true);

    try {
      // Get current user
      const {
        data: { session },
        error: sessionError,
      } = await superbase.auth.getSession();

      if (sessionError || !session) {
        setError("You must be logged in to create a workspace.");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Insert workspace
      const { data: wsData, error: wsError } = await superbase
        .from("workspaces")
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          emoji,
          created_by: userId,
        })
        .select()
        .single();

      if (wsError) {
        if (wsError.code === "23505") {
          // unique violation
          setSlugError("This slug is already taken. Try a different one.");
        } else {
          setError(wsError.message);
        }
        setLoading(false);
        return;
      }

      // Add creator as owner in workspace_members
      const { error: memberError } = await superbase
        .from("workspace_members")
        .insert({
          workspace_id: wsData.id,
          user_id: userId,
          role: "owner",
        });

      if (memberError) {
        // Non-fatal — workspace was created, just log
        console.error("Failed to add owner to workspace_members:", memberError);
      }

      onCreated(wsData as Workspace);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal panel */}
      <div
        ref={modalRef}
        className="w-full max-w-[480px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-[#E4E4E7] dark:border-[#27272A]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#09090B] dark:text-[#FAFAFA]">
              Create Workspace
            </h2>
            <p className="text-[12px] text-[#A1A1AA] mt-[2px]">
              A workspace groups your projects and team members.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-[24px] py-[20px] flex flex-col gap-[18px]">

          {/* Emoji + Name row */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">
              Workspace Name <span className="text-[#991B1B] dark:text-[#F87171]">*</span>
            </label>
            <div className="flex items-center gap-[8px]">
              {/* Emoji trigger */}
              <div className="relative">
                <button
                  type="button"
                  id="emoji-picker-btn"
                  onClick={() => setEmojiPickerOpen((v) => !v)}
                  className="w-[40px] h-[40px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center text-[20px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 shrink-0"
                  title="Choose emoji"
                >
                  {emoji}
                </button>

                {/* Emoji picker dropdown */}
                {emojiPickerOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 z-10 w-[220px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-[10px]">
                    <p className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-wider mb-[8px]">Choose icon</p>
                    <div className="grid grid-cols-8 gap-[4px]">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => { setEmoji(e); setEmojiPickerOpen(false); }}
                          className={`w-[24px] h-[24px] rounded-[4px] text-[14px] flex items-center justify-center hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-75 ${e === emoji ? "bg-[#F4F4F5] dark:bg-[#18181B]" : ""}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Name input */}
              <input
                ref={nameRef}
                id="workspace-name-input"
                type="text"
                placeholder="e.g. My Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="flex-1 h-[40px] px-[12px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors duration-100"
              />
            </div>
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center justify-between">
              <label htmlFor="workspace-slug-input" className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">
                Slug <span className="text-[#991B1B] dark:text-[#F87171]">*</span>
              </label>
              {slugManuallyEdited && (
                <button
                  type="button"
                  onClick={handleSlugReset}
                  className="text-[11px] text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100"
                >
                  Reset to auto
                </button>
              )}
            </div>
            <div className="flex items-center h-[40px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] overflow-hidden focus-within:border-[#09090B] dark:focus-within:border-[#FAFAFA] transition-colors duration-100">
              <span className="px-[12px] text-[12px] text-[#A1A1AA] border-r border-[#E4E4E7] dark:border-[#27272A] h-full flex items-center select-none shrink-0">
                dineezy.app/
              </span>
              <input
                id="workspace-slug-input"
                type="text"
                placeholder="my-team"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                maxLength={60}
                className="flex-1 px-[12px] h-full bg-transparent text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none font-mono"
              />
            </div>
            {slugError && (
              <p className="text-[11px] text-[#991B1B] dark:text-[#F87171]">{slugError}</p>
            )}
            {!slugError && slug && (
              <p className="text-[11px] text-[#A1A1AA]">
                Your workspace will be accessible at{" "}
                <span className="text-[#09090B] dark:text-[#FAFAFA] font-medium">dineezy.app/{slug}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="workspace-description-input" className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">
              Description <span className="text-[#A1A1AA] font-normal">(optional)</span>
            </label>
            <textarea
              id="workspace-description-input"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors duration-100 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-[#A1A1AA] text-right">{description.length}/300</p>
          </div>

          {/* Global error */}
          {error && (
            <div className="flex items-start gap-[8px] px-[12px] py-[10px] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.08)] border border-[#FECACA] dark:border-[rgba(239,68,68,0.25)] rounded-[8px]">
              <svg className="shrink-0 mt-[1px]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-[12px] text-[#991B1B] dark:text-[#F87171]">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-[8px] pt-[4px]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-[36px] px-[16px] rounded-[8px] text-[13px] font-medium text-[#52525B] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#27272A] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="create-workspace-submit-btn"
              type="submit"
              disabled={loading || !name.trim() || !!slugError}
              className="h-[36px] px-[16px] rounded-[8px] text-[13px] font-medium bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:opacity-90 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-[8px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create Workspace"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
