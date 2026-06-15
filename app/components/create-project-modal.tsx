"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { superbase } from "../../utils/supabase_client";
import { type ProjectItem } from "../hooks/useProjects";

// ── Constants ────────────────────────────────────────────────────────────────
const EMOJI_OPTIONS = [
  "📁", "🚀", "⚡", "🎯", "💡", "🔥", "🌟", "🎨",
  "🛠️", "📊", "🧩", "🌍", "🏆", "🎮", "💼", "🔬",
  "📱", "💻", "🖥️", "📝", "📌", "🔐", "🧪", "🎵",
  "🌿", "🦋", "💎", "🌈", "🤝", "📦", "🏗️", "⚙️",
];

const COLOR_OPTIONS = [
  { label: "Zinc",    value: "#71717A", bg: "bg-[#71717A]" },
  { label: "Red",     value: "#EF4444", bg: "bg-[#EF4444]" },
  { label: "Orange",  value: "#F97316", bg: "bg-[#F97316]" },
  { label: "Amber",   value: "#F59E0B", bg: "bg-[#F59E0B]" },
  { label: "Green",   value: "#22C55E", bg: "bg-[#22C55E]" },
  { label: "Teal",    value: "#14B8A6", bg: "bg-[#14B8A6]" },
  { label: "Blue",    value: "#3B82F6", bg: "bg-[#3B82F6]" },
  { label: "Violet",  value: "#8B5CF6", bg: "bg-[#8B5CF6]" },
  { label: "Pink",    value: "#EC4899", bg: "bg-[#EC4899]" },
];

const STATUS_OPTIONS: { value: ProjectItem["status"]; label: string; dot: string }[] = [
  { value: "active",    label: "Active",    dot: "bg-[#22C55E]" },
  { value: "archived",  label: "Archived",  dot: "bg-[#A1A1AA]" },
  { value: "completed", label: "Completed", dot: "bg-[#3B82F6]" },
];

// ── Props ────────────────────────────────────────────────────────────────────
interface CreateProjectModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onCreated: (project: ProjectItem) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export function CreateProjectModal({
  isOpen,
  workspaceId,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [color, setColor] = useState(COLOR_OPTIONS[6].value); // blue default
  const [status, setStatus] = useState<ProjectItem["status"]>("active");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  // Auto-focus name on open
  useEffect(() => {
    if (isOpen) setTimeout(() => nameRef.current?.focus(), 50);
  }, [isOpen]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setEmoji("📁");
      setColor(COLOR_OPTIONS[6].value);
      setStatus("active");
      setEmojiPickerOpen(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Project name is required."); return; }

    setLoading(true);
    try {
      const { data: { session } } = await superbase.auth.getSession();
      if (!session) { setError("You must be logged in."); setLoading(false); return; }

      const { data, error: insertError } = await superbase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          description: description.trim() || null,
          emoji,
          color,
          status,
          created_by: session.user.id,
        })
        .select("id, workspace_id, name, description, emoji, color, status, created_by, created_at")
        .single();

      if (insertError) { setError(insertError.message); setLoading(false); return; }

      onCreated(data as ProjectItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [name, description, emoji, color, status, workspaceId, onCreated]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[480px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
        style={{ animation: "modalIn 0.18s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-[#E4E4E7] dark:border-[#27272A]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#09090B] dark:text-[#FAFAFA]">New Project</h2>
            <p className="text-[12px] text-[#A1A1AA] mt-[2px]">Add a project to your workspace.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-[24px] py-[20px] flex flex-col gap-[18px]">

          {/* Emoji + Name */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">
              Project Name <span className="text-[#991B1B] dark:text-[#F87171]">*</span>
            </label>
            <div className="flex items-center gap-[8px]">
              {/* Emoji picker */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setEmojiPickerOpen(v => !v)}
                  className="w-[40px] h-[40px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center text-[20px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100"
                >
                  {emoji}
                </button>
                {emojiPickerOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 z-10 w-[220px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-[10px]">
                    <p className="text-[10px] font-medium text-[#A1A1AA] uppercase tracking-wider mb-[8px]">Choose icon</p>
                    <div className="grid grid-cols-8 gap-[4px]">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e} type="button"
                          onClick={() => { setEmoji(e); setEmojiPickerOpen(false); }}
                          className={`w-[24px] h-[24px] rounded-[4px] text-[14px] flex items-center justify-center hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-75 ${e === emoji ? "bg-[#F4F4F5] dark:bg-[#18181B]" : ""}`}
                        >{e}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={nameRef}
                id="project-name-input"
                type="text"
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="flex-1 h-[40px] px-[12px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors duration-100"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">
              Description <span className="text-[#A1A1AA] font-normal">(optional)</span>
            </label>
            <textarea
              id="project-description-input"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B] text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors duration-100 resize-none leading-relaxed"
            />
          </div>

          {/* Color + Status row */}
          <div className="grid grid-cols-2 gap-[14px]">
            {/* Color */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">Color</label>
              <div className="flex flex-wrap gap-[6px]">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.value)}
                    className={`w-[22px] h-[22px] rounded-full ${c.bg} transition-all duration-100 ${color === c.value ? "ring-2 ring-offset-2 ring-[#09090B] dark:ring-[#FAFAFA] dark:ring-offset-[#0A0A0A]" : "opacity-60 hover:opacity-100"}`}
                  />
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">Status</label>
              <div className="flex flex-col gap-[4px]">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`flex items-center gap-[8px] h-[28px] px-[8px] rounded-[6px] text-left transition-colors duration-100 ${status === s.value ? "bg-[#F4F4F5] dark:bg-[#18181B]" : "hover:bg-[#F4F4F5] dark:hover:bg-[#18181B]"}`}
                  >
                    <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-[12px] text-[#09090B] dark:text-[#FAFAFA]">{s.label}</span>
                    {status === s.value && (
                      <svg className="ml-auto" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-[8px] px-[12px] py-[10px] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.08)] border border-[#FECACA] dark:border-[rgba(239,68,68,0.25)] rounded-[8px]">
              <svg className="shrink-0 mt-[1px]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
              id="create-project-submit-btn"
              type="submit"
              disabled={loading || !name.trim()}
              className="h-[36px] px-[16px] rounded-[8px] text-[13px] font-medium bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:opacity-90 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-[8px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating…
                </>
              ) : "Create Project"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
