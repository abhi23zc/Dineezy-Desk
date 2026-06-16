"use client";

import React, { useEffect, useState } from "react";

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: { id: string; name: string; emoji: string; slug: string; description: string | null };
  onUpdate: (fields: { name?: string; emoji?: string; slug?: string; description?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

const EMOJI_OPTIONS = [
  "🏢", "🚀", "⚡", "🎯", "💡", "🔥", "🌟", "🎨",
  "🛠️", "📊", "🧩", "🌍", "🏆", "🎮", "💼", "🔬",
  "🍕", "🎵", "🏄", "🌿", "🦋", "🐉", "💎", "🌈",
  "👤", "👥", "🤝", "📱", "💻", "🖥️", "📝", "📌",
];

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function WorkspaceSettingsModal({ isOpen, onClose, workspace, onUpdate, onDelete }: WorkspaceSettingsModalProps) {
  const [name, setName] = useState(workspace.name);
  const [emoji, setEmoji] = useState(workspace.emoji);
  const [slug, setSlug] = useState(workspace.slug);
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState(workspace.description || "");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync when workspace changes
  useEffect(() => {
    setName(workspace.name);
    setEmoji(workspace.emoji);
    setSlug(workspace.slug);
    setDescription(workspace.description || "");
    setSlugManual(false);
    setConfirmDel(false);
  }, [workspace]);

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!slugManual) setSlug(toSlug(name));
  }, [name, slugManual]);

  if (!isOpen) return null;

  const hasChanges = name !== workspace.name || emoji !== workspace.emoji || slug !== workspace.slug || description !== (workspace.description || "");

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    const fields: { name?: string; emoji?: string; slug?: string; description?: string } = {};
    if (name !== workspace.name) fields.name = name.trim();
    if (emoji !== workspace.emoji) fields.emoji = emoji;
    if (slug !== workspace.slug) fields.slug = slug.trim();
    if (description !== (workspace.description || "")) fields.description = description.trim();
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
          <h2 className="text-[15px] font-semibold">Workspace Settings</h2>
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

        {/* Slug */}
        <div className="flex flex-col gap-[4px]">
          <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Slug</label>
          <input
            value={slug}
            onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setSlugManual(true); }}
            className="h-[36px] px-[10px] rounded-[6px] border border-[#E4E4E7] dark:border-[#27272A] bg-transparent text-[13px] font-mono outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors"
          />
          <p className="text-[11px] text-[#A1A1AA]">Auto-generated from name. Edit to customize.</p>
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
          disabled={!hasChanges || !name.trim() || !slug.trim() || saving}
          className="h-[36px] rounded-[8px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {/* Danger zone */}
        <div className="border-t border-[#E4E4E7] dark:border-[#27272A] pt-[16px] flex flex-col gap-[8px]">
          <p className="text-[11px] font-medium text-[#991B1B] dark:text-[#F87171] uppercase tracking-wider">Danger zone</p>
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} className="h-[34px] px-[14px] rounded-[6px] border border-[#991B1B] dark:border-[#F87171] text-[#991B1B] dark:text-[#F87171] text-[13px] font-medium hover:bg-[#FEF2F2] dark:hover:bg-[rgba(239,68,68,0.08)] transition-colors self-start">
              Delete workspace
            </button>
          ) : (
            <div className="flex flex-col gap-[8px] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.08)] rounded-[8px] p-[12px]">
              <p className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                This will permanently delete <strong>{workspace.name}</strong> and all its projects, modules, and tasks. This cannot be undone.
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
