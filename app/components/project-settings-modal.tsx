"use client";

import React, { useEffect, useState } from "react";
import type { ProjectItem } from "../hooks/useProjects";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  onUpdate: (fields: { name?: string; emoji?: string; color?: string | null; description?: string; status?: ProjectItem["status"] }) => Promise<void>;
  onDelete: () => Promise<void>;
}

const EMOJI_OPTIONS = [
  "📁", "🚀", "⚡", "🎯", "💡", "🔥", "🌟", "🎨",
  "🛠️", "📊", "🧩", "🌍", "🏆", "🎮", "💼", "🔬",
  "🍕", "🎵", "🏄", "🌿", "🦋", "🐉", "💎", "🌈",
  "📱", "💻", "🖥️", "📝", "📌", "🗂️", "📋", "✨",
];

const COLOR_OPTIONS = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E",
  "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6",
  "#EC4899", "#F43F5E", null,
];

const STATUS_OPTIONS: { value: ProjectItem["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "completed", label: "Completed" },
];

export function ProjectSettingsModal({ isOpen, onClose, project, onUpdate, onDelete }: ProjectSettingsModalProps) {
  const [name, setName] = useState(project.name);
  const [emoji, setEmoji] = useState(project.emoji);
  const [color, setColor] = useState<string | null>(project.color);
  const [description, setDescription] = useState(project.description || "");
  const [status, setStatus] = useState<ProjectItem["status"]>(project.status);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(project.name);
    setEmoji(project.emoji);
    setColor(project.color);
    setDescription(project.description || "");
    setStatus(project.status);
    setConfirmDel(false);
  }, [project]);

  if (!isOpen) return null;

  const hasChanges = name !== project.name || emoji !== project.emoji || color !== project.color || description !== (project.description || "") || status !== project.status;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const fields: Parameters<typeof onUpdate>[0] = {};
    if (name !== project.name) fields.name = name.trim();
    if (emoji !== project.emoji) fields.emoji = emoji;
    if (color !== project.color) fields.color = color;
    if (description !== (project.description || "")) fields.description = description.trim();
    if (status !== project.status) fields.status = status;
    await onUpdate(fields);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative w-[420px] max-w-[90vw] max-h-[85vh] overflow-y-auto bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[12px] shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-[24px] flex flex-col gap-[20px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Project Settings</h2>
          <button onClick={onClose} className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Emoji + Name */}
        <div className="flex items-start gap-[12px]">
          <div className="relative">
            <button onClick={() => setEmojiOpen((v) => !v)} className="w-[44px] h-[44px] rounded-[8px] bg-[#F4F4F5] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-center text-[20px] hover:border-[#09090B] dark:hover:border-[#FAFAFA] transition-colors">
              {emoji}
            </button>
            {emojiOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[208px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] shadow-lg p-[8px] grid grid-cols-8 gap-[2px]">
                {EMOJI_OPTIONS.map((e) => (
                  <button key={e} onClick={() => { setEmoji(e); setEmojiOpen(false); }} className={`w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[14px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] ${e === emoji ? "bg-[#F4F4F5] dark:bg-[#18181B] ring-1 ring-[#09090B] dark:ring-[#FAFAFA]" : ""}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-[4px]">
            <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[36px] px-[10px] rounded-[6px] border border-[#E4E4E7] dark:border-[#27272A] bg-transparent text-[13px] outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors"
            />
          </div>
        </div>

        {/* Color */}
        <div className="flex flex-col gap-[6px]">
          <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Color</label>
          <div className="flex items-center gap-[6px] flex-wrap">
            {COLOR_OPTIONS.map((c, i) => (
              <button
                key={i}
                onClick={() => setColor(c)}
                className={`w-[24px] h-[24px] rounded-full border-2 transition-colors ${color === c ? "border-[#09090B] dark:border-[#FAFAFA] scale-110" : "border-transparent hover:scale-110"}`}
                style={{ backgroundColor: c || undefined }}
                title={c || "No color"}
              >
                {!c && <span className="flex items-center justify-center w-full h-full rounded-full bg-[#F4F4F5] dark:bg-[#18181B] text-[10px] text-[#A1A1AA]">✕</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-[6px]">
          <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Status</label>
          <div className="flex items-center gap-[6px]">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`h-[30px] px-[12px] rounded-[6px] text-[12px] font-medium transition-colors ${status === opt.value ? "bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B]" : "bg-[#F4F4F5] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#E4E4E7] dark:hover:bg-[#27272A]"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-[4px]">
          <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="px-[10px] py-[8px] rounded-[6px] border border-[#E4E4E7] dark:border-[#27272A] bg-transparent text-[13px] outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors resize-none"
            placeholder="Optional description..."
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || !name.trim() || saving}
          className="h-[36px] rounded-[8px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed p-3 cursor-pointer flex items-center justify-center"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {/* Danger zone */}
        <div className="border-t border-[#E4E4E7] dark:border-[#27272A] pt-[16px] flex flex-col gap-[8px]">
          <p className="text-[11px] font-medium text-[#991B1B] dark:text-[#F87171] uppercase tracking-wider">Danger zone</p>
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} className="h-[34px] px-[14px] rounded-[6px] border border-[#991B1B] dark:border-[#F87171] text-[#991B1B] dark:text-[#F87171] text-[13px] font-medium hover:bg-[#FEF2F2] dark:hover:bg-[rgba(239,68,68,0.08)] transition-colors self-start">
              Delete project
            </button>
          ) : (
            <div className="flex flex-col gap-[8px] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.08)] rounded-[8px] p-[12px]">
              <p className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                This will permanently delete <strong>{project.name}</strong> and all its modules and tasks. This cannot be undone.
              </p>
              <div className="flex gap-[8px]">
                <button onClick={handleDelete} disabled={deleting} className="h-[30px] px-[14px] rounded-[6px] bg-[#991B1B] text-white text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {deleting ? "Deleting..." : "Confirm delete"}
                </button>
                <button onClick={() => setConfirmDel(false)} className="h-[30px] px-[14px] rounded-[6px] border border-[#E4E4E7] dark:border-[#27272A] text-[12px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
