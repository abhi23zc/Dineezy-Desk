"use client";

/**
 * Pure presentational components for the dashboard.
 * All logic (data fetching, mutations) lives in hooks — this file is UI only.
 */

import React, { useEffect, useRef, useState } from "react";
import { type Task, type TaskStats, type TaskStatus, type TaskPriority } from "../hooks/useTasks";
import { type Collection } from "../hooks/useCollections";
import { type WorkspaceMember } from "../hooks/useWorkspaceMembers";
import { AttachmentManager } from "./attachment-manager";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
export const Icon = {
  module: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="4" y="9" width="16" height="6" /><line x1="10" y1="4" x2="10" y2="20" /></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  check: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  chevronDown: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
  inbox: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>,
  menu: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// Style maps (strictly matching hex codes in design.md)
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "bg-bg-raised text-text-secondary border border-border-custom",
  medium: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.15)] text-[#92400E] dark:text-[#FBBF24]",
  high: "bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171]",
  critical: "bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.2)] text-[#991B1B] dark:text-[#F87171] font-semibold",
};

export const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "bg-[#FFFFFF] dark:bg-[#000000] text-[#52525B] dark:text-[#A1A1AA] border border-border-custom",
  in_progress: "bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA]",
  review: "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.15)] text-[#92400E] dark:text-[#FBBF24]",
  done: "bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399]",
  blocked: "bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171]",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do", in_progress: "In progress", review: "Review", done: "Done", blocked: "Blocked",
};

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done", "blocked"];

const AVATAR_COLORS = [
  "bg-bg-raised text-text-secondary",
  "bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399]",
  "bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171]",
  "bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.15)] text-[#92400E] dark:text-[#FBBF24]",
  "bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.15)] text-[#3730A3] dark:text-[#818CF8]",
];

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusDropdown — click the status badge to change it
// ─────────────────────────────────────────────────────────────────────────────
interface StatusDropdownProps {
  current: TaskStatus;
  onChange: (s: TaskStatus) => void;
}

function StatusDropdown({ current, onChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`text-[11px] font-medium px-[7px] py-[2.5px] rounded-[4px] cursor-pointer hover:opacity-90 transition-all ${STATUS_STYLE[current]}`}
        title="Change status"
      >
        {STATUS_LABEL[current]}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[140px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-border-custom rounded-[8px] py-[4px] overflow-hidden animate-slide-down-in shadow-md">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
              className={`w-full flex items-center gap-[8px] px-[10px] h-[32px] text-left text-[12px] hover:bg-bg-raised text-text-secondary hover:text-foreground transition-colors duration-100 ${current === s ? "font-semibold text-foreground" : ""}`}
            >
              <span className={`text-[11px] font-medium px-[5px] py-[1.5px] rounded-[3px] ${STATUS_STYLE[s]}`}>
                {STATUS_LABEL[s]}
              </span>
              {current === s && <span className="ml-auto text-foreground">{Icon.check}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PriorityDropdown
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};
const ALL_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

function PriorityDropdown({ current, onChange }: { current: TaskPriority; onChange: (p: TaskPriority) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`text-[11px] font-medium px-[7px] py-[2.5px] rounded-[4px] cursor-pointer hover:opacity-90 transition-all ${PRIORITY_STYLE[current]}`}
        title="Change priority"
      >
        {PRIORITY_LABEL[current]}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[120px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-border-custom rounded-[8px] py-[4px] overflow-hidden animate-slide-down-in shadow-md">
          {ALL_PRIORITIES.map((p) => (
            <button key={p} onClick={(e) => { e.stopPropagation(); onChange(p); setOpen(false); }}
              className={`w-full flex items-center gap-[8px] px-[10px] h-[32px] text-left hover:bg-bg-raised text-text-secondary hover:text-foreground transition-colors duration-100 ${current === p ? "font-semibold text-foreground" : ""}`}>
              <span className={`text-[11px] font-medium px-[5px] py-[1.5px] rounded-[3px] ${PRIORITY_STYLE[p]}`}>{PRIORITY_LABEL[p]}</span>
              {current === p && <span className="ml-auto text-foreground">{Icon.check}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatsRow
// ─────────────────────────────────────────────────────────────────────────────
interface StatsRowProps { stats: TaskStats; collectionCount: number; }

export function StatsRow({ stats, collectionCount }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] md:gap-[16px] mb-[24px] md:mb-[32px]">
      <StatCard label="Total tasks" value={stats.total} sub={`across ${collectionCount} module${collectionCount !== 1 ? "s" : ""}`} />
      <StatCard label="In progress" value={stats.inProgress} sub={stats.overdue > 0 ? `${stats.overdue} overdue` : "on track"} subDanger={stats.overdue > 0} />
      <StatCard label="Completed" value={stats.completed} sub="this sprint" />
      <StatCard label="Unassigned" value={stats.unassigned} sub="needs owner" />
    </div>
  );
}

function StatCard({ label, value, sub, subDanger }: { label: string; value: number; sub: string; subDanger?: boolean }) {
  return (
    <div className="bg-bg-card border border-border-custom rounded-[8px] p-[14px] md:p-[16px]">
      <div className="text-[12px] text-text-secondary mb-[8px]">{label}</div>
      <div className="text-[18px] md:text-[20px] font-medium text-foreground mb-[4px]">{value}</div>
      <div className={`text-[11px] ${subDanger ? "text-[#92400E] dark:text-[#FBBF24] font-medium" : "text-text-muted"}`}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskRow
// ─────────────────────────────────────────────────────────────────────────────
interface TaskRowProps {
  task: Task;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleDone: () => void;
  onChangeStatus: (s: TaskStatus) => void;
  onSaveDescription: (description: string) => void;
  onSaveTitle: (title: string) => void;
  onChangePriority: (p: TaskPriority) => void;
  onSaveDueDate: (date: string | null) => void;
  onDelete: () => void;
  members: WorkspaceMember[];
  onAssignUser: (assignee: { user_id: string; full_name: string | null; avatar_url: string | null }) => void;
  onUnassignUser: (userId: string) => void;
}

export function TaskRow({
  task, isLast, isExpanded,
  onToggleExpand, onToggleDone, onChangeStatus, onSaveDescription,
  onSaveTitle, onChangePriority, onSaveDueDate, onDelete, members, onAssignUser, onUnassignUser,
}: TaskRowProps) {
  const isDone = task.status === "done";
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

  return (
    <>
      <div
        onClick={onToggleExpand}
        className={`flex items-center px-[16px] min-h-[44px] md:min-h-[40px] hover:bg-bg-raised transition-colors duration-100 cursor-pointer group ${!isLast || isExpanded ? "border-b border-border-custom" : ""
          }`}
      >
        {/* Checkbox */}
        <div
          role="checkbox"
          aria-checked={isDone}
          aria-label={isDone ? "Mark as todo" : "Mark as done"}
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
          className={`w-[16px] h-[16px] rounded-[4px] mr-[12px] shrink-0 flex items-center justify-center cursor-pointer transition-colors duration-75 ${isDone
            ? "bg-foreground text-background"
            : "border border-border-custom hover:border-text-secondary bg-bg-card"
            }`}
        >
          {isDone && <span className="text-background">{Icon.check}</span>}
        </div>

        {/* Title */}
        <div className={`flex-1 text-[13px] text-foreground truncate mr-[12px] ${isDone ? "line-through opacity-50" : ""}`}>
          {task.title}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-[8px] md:gap-[10px] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-100">
          {/* Priority */}
          <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
            <PriorityDropdown current={task.priority} onChange={onChangePriority} />
          </div>

          {/* Status */}
          <div onClick={(e) => e.stopPropagation()}>
            <StatusDropdown current={task.status} onChange={onChangeStatus} />
          </div>

          {/* Assignees */}
          {task.assignees.length > 0 && (
            <div className="hidden sm:flex items-center">
              {task.assignees.slice(0, 3).map((a, i) => (
                <div
                  key={a.user_id}
                  title={a.full_name ?? "Unknown"}
                  className={`w-[20px] h-[20px] rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[9px] font-medium flex items-center justify-center border-[1.5px] border-white dark:border-[#0A0A0A] -ml-[5px] first:ml-0`}
                >
                  {initials(a.full_name)}
                </div>
              ))}
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <span className={`hidden sm:inline text-[11px] w-[50px] text-right ${isOverdue ? "text-[#991B1B] dark:text-[#F87171]" : "text-text-muted"}`}>
              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}

          {/* Expand chevron */}
          <span className={`text-text-muted transition-transform duration-100 ${isExpanded ? "rotate-180" : ""}`}>
            {Icon.chevronDown}
          </span>
        </div>
      </div>

      {isExpanded && (
        <ExpandedTaskPanel
          task={task} isLast={isLast} isOverdue={!!isOverdue}
          onSaveDescription={onSaveDescription} onSaveTitle={onSaveTitle}
          onChangePriority={onChangePriority} onSaveDueDate={onSaveDueDate}
          onDelete={onDelete} members={members}
          onAssignUser={onAssignUser} onUnassignUser={onUnassignUser}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExpandedTaskPanel
// ─────────────────────────────────────────────────────────────────────────────
function ExpandedTaskPanel({
  task, isLast, isOverdue,
  onSaveDescription, onSaveTitle, onChangePriority, onSaveDueDate,
  onDelete, members, onAssignUser, onUnassignUser,
}: {
  task: Task; isLast: boolean; isOverdue: boolean;
  onSaveDescription: (d: string) => void;
  onSaveTitle: (t: string) => void;
  onChangePriority: (p: TaskPriority) => void;
  onSaveDueDate: (d: string | null) => void;
  onDelete: () => void;
  members: WorkspaceMember[];
  onAssignUser: (a: { user_id: string; full_name: string | null; avatar_url: string | null }) => void;
  onUnassignUser: (userId: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(task.description ?? "");
  const [showDateInput, setShowDateInput] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTitleDraft(task.title); }, [task.title]);
  useEffect(() => { setDescDraft(task.description ?? ""); }, [task.description]);
  useEffect(() => {
    if (!assignOpen) return;
    const h = (e: MouseEvent) => { if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [assignOpen]);

  const assignedIds = new Set(task.assignees.map((a) => a.user_id));
  const unassignedMembers = members.filter((m) => !assignedIds.has(m.user_id));

  return (
    <div className={`px-[16px] sm:px-[44px] py-[14px] bg-bg-page flex flex-col gap-[10px] ${!isLast ? "border-b border-border-custom" : ""}`}>

      {/* Editable title */}
      {editingTitle ? (
        <input
          autoFocus value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => { setEditingTitle(false); if (titleDraft.trim() && titleDraft !== task.title) onSaveTitle(titleDraft.trim()); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setEditingTitle(false); if (titleDraft.trim() && titleDraft !== task.title) onSaveTitle(titleDraft.trim()); }
            if (e.key === "Escape") { setEditingTitle(false); setTitleDraft(task.title); }
          }}
          className="w-full text-[13px] font-semibold text-foreground bg-bg-card border border-border-custom rounded-[6px] px-[10px] py-[6px] focus-glow transition-all"
        />
      ) : (
        <p onClick={() => setEditingTitle(true)}
          className="text-[13px] font-semibold cursor-text rounded-[4px] px-[4px] py-[2px] -mx-[4px] hover:bg-bg-raised text-foreground transition-colors"
          title="Click to edit title">
          {task.title}
        </p>
      )}

      {/* Editable description */}
      {editingDesc ? (
        <textarea autoFocus value={descDraft} rows={3}
          onChange={(e) => setDescDraft(e.target.value)}
          onBlur={() => { setEditingDesc(false); if (descDraft !== (task.description ?? "")) onSaveDescription(descDraft); }}
          onKeyDown={(e) => { if (e.key === "Escape") { setEditingDesc(false); setDescDraft(task.description ?? ""); } }}
          placeholder="Add a description…"
          className="w-full text-[13px] text-foreground bg-bg-card border border-border-custom rounded-[6px] px-[10px] py-[8px] focus-glow resize-none leading-relaxed placeholder-text-muted transition-all"
        />
      ) : (
        <p onClick={() => setEditingDesc(true)}
          className="text-[13px] leading-relaxed cursor-text rounded-[4px] px-[4px] py-[2px] -mx-[4px] hover:bg-bg-raised transition-colors" title="Click to edit description">
          {task.description
            ? <span className="text-text-secondary">{task.description}</span>
            : <span className="text-text-muted italic">No description — click to add one.</span>}
        </p>
      )}

      {/* Priority + Due date row */}
      <div className="flex items-center gap-[16px] flex-wrap text-[11px] text-text-muted">
        <div className="flex items-center gap-[8px]">
          <span className="text-text-secondary">Priority</span>
          <PriorityDropdown current={task.priority} onChange={onChangePriority} />
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="text-text-secondary">Due Date</span>
          {showDateInput ? (
            <input type="date"
              defaultValue={task.due_date ? task.due_date.split("T")[0] : ""}
              autoFocus
              onBlur={(e) => { setShowDateInput(false); onSaveDueDate(e.target.value || null); }}
              onKeyDown={(e) => { if (e.key === "Escape") setShowDateInput(false); }}
              className="text-[11px] text-foreground bg-bg-card border border-border-custom rounded-[4px] px-[6px] py-[2px] focus-glow outline-none"
            />
          ) : (
            <button onClick={() => setShowDateInput(true)}
              className={`text-[11px] px-[8px] py-[3px] rounded-[4px] bg-bg-card border border-border-custom hover:border-text-secondary transition-colors ${isOverdue ? "text-[#991B1B] dark:text-[#F87171]" : task.due_date ? "text-text-secondary" : "text-text-muted italic"
                }`}>
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Set date"}
            </button>
          )}
          {task.due_date && !showDateInput && (
            <button onClick={() => onSaveDueDate(null)} className="text-[10px] text-text-muted hover:text-[#991B1B] dark:hover:text-[#F87171] transition-colors" title="Clear due date">{Icon.x}</button>
          )}
        </div>
      </div>

      {/* Assignees */}
      <div className="flex items-center gap-[8px] flex-wrap">
        <span className="text-[11px] text-text-secondary shrink-0">Assigned</span>
        {task.assignees.map((a, i) => (
          <div key={a.user_id} className="flex items-center gap-[6px] bg-bg-card border border-border-custom px-[6px] py-[2px] rounded-full">
            <div className={`w-[16px] h-[16px] rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[8px] font-medium flex items-center justify-center`} title={a.full_name ?? "Unknown"}>
              {initials(a.full_name)}
            </div>
            <span className="text-[11px] text-text-secondary hidden sm:inline">{a.full_name ?? "?"}</span>
            <button onClick={() => onUnassignUser(a.user_id)} className="text-text-muted hover:text-[#991B1B] dark:hover:text-[#F87171] transition-colors" title="Remove">{Icon.x}</button>
          </div>
        ))}
        {task.assignees.length === 0 && <span className="text-[11px] text-text-muted italic">No owner assigned</span>}
        {/* Assign picker */}
        <div ref={assignRef} className="relative">
          <button onClick={() => setAssignOpen((v) => !v)}
            className="w-[20px] h-[20px] rounded-full border border-dashed border-border-custom flex items-center justify-center text-text-muted hover:border-text-secondary hover:text-foreground transition-all active:scale-95"
            title="Assign member">
            {Icon.plus}
          </button>
          {assignOpen && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[180px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-border-custom rounded-[8px] py-[4px] overflow-hidden shadow-md">
              {unassignedMembers.length === 0
                ? <p className="text-[12px] text-text-muted px-[10px] py-[8px] italic">All members assigned</p>
                : unassignedMembers.map((m, i) => (
                  <button key={m.user_id}
                    onClick={() => { onAssignUser({ user_id: m.user_id, full_name: m.full_name, avatar_url: null }); setAssignOpen(false); }}
                    className="w-full flex items-center gap-[8px] px-[10px] h-[36px] text-left hover:bg-bg-raised text-text-secondary hover:text-foreground transition-colors duration-100">
                    <div className={`w-[20px] h-[20px] rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[9px] font-medium flex items-center justify-center shrink-0`}>
                      {initials(m.full_name || m.email)}
                    </div>
                    <span className="text-[12px] truncate">{m.full_name || m.email || "Unknown"}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: created + delete */}
      <div className="flex items-center justify-between border-t border-border-custom pt-[10px] mt-[4px]">
        <span className="text-[11px] text-text-muted">
          Created {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        {confirmDelete ? (
          <div className="flex items-center gap-[8px]">
            <span className="text-[11px] text-[#991B1B] dark:text-[#F87171]">Delete task?</span>
            <button onClick={onDelete} className="text-[11px] font-semibold text-[#991B1B] dark:text-[#F87171] hover:underline">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-text-muted hover:underline">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="text-[11px] text-text-muted hover:text-[#991B1B] dark:hover:text-[#F87171] transition-colors">
            Delete task
          </button>
        )}
      </div>

      {/* Attachments */}
      <AttachmentManager taskId={task.id} isExpanded={true} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineTaskInput
// ─────────────────────────────────────────────────────────────────────────────
interface InlineTaskInputProps {
  onSubmit: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
}

export function InlineTaskInput({ onSubmit, onCancel }: InlineTaskInputProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<"title" | "description">("title");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);
  useEffect(() => { if (phase === "description") descRef.current?.focus(); }, [phase]);

  const handleTitleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim()) { e.preventDefault(); setPhase("description"); }
    else if (e.key === "Escape") onCancel();
  };

  const handleDescKey = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setSubmitting(true);
      await onSubmit(title.trim(), description.trim());
      setSubmitting(false);
    } else if (e.key === "Escape") {
      setPhase("title");
      setDescription("");
    }
  };

  return (
    <div className="border-t border-border-custom bg-bg-page animate-slide-down-in">
      {/* Title row */}
      <div className="flex items-center px-[16px] h-[44px]">
        <div className="w-[16px] h-[16px] rounded-[4px] border border-dashed border-border-custom mr-[12px] shrink-0" />
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleTitleKey}
          placeholder="Task name…"
          disabled={submitting || phase === "description"}
          className="flex-1 text-[13px] text-foreground bg-transparent outline-none placeholder-text-muted"
        />
      </div>

      {phase === "title" && (
        <div className="flex items-center gap-[8px] px-[16px] pb-[12px] ml-[28px]">
          <button
            onClick={async () => {
              if (title.trim()) {
                setSubmitting(true);
                await onSubmit(title.trim(), "");
                setSubmitting(false);
              }
            }}
            disabled={submitting || !title.trim()}
            className="h-[28px] px-[12px] rounded-[6px] bg-foreground text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97] cursor-pointer"
          >
            Save task
          </button>
          <button
            onClick={() => {
              if (title.trim()) {
                setPhase("description");
              }
            }}
            disabled={submitting || !title.trim()}
            className="h-[28px] px-[12px] rounded-[6px] border border-border-custom text-foreground bg-bg-card text-[12px] font-medium hover:bg-bg-raised disabled:opacity-50 transition-all active:scale-[0.97] cursor-pointer"
          >
            Add description
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="h-[28px] px-[10px] text-[12px] text-text-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Description row */}
      {phase === "description" && (
        <div className="px-[16px] sm:px-[44px] pb-[12px] flex flex-col gap-[6px]">
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleDescKey}
            placeholder="Description (optional)"
            rows={2}
            disabled={submitting}
            className="w-full text-[13px] text-foreground bg-bg-card border border-border-custom rounded-[6px] px-[10px] py-[8px] focus-glow resize-none leading-relaxed placeholder-text-muted disabled:opacity-60 transition-all"
          />
          <div className="flex items-center gap-[8px]">
            <button
              onClick={async () => { setSubmitting(true); await onSubmit(title.trim(), description.trim()); setSubmitting(false); }}
              disabled={submitting}
              className="h-[28px] px-[12px] rounded-[6px] bg-foreground text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97] cursor-pointer"
            >
              {submitting ? "Saving…" : "Save task"}
            </button>
            <button
              onClick={() => {
                setPhase("title");
              }}
              disabled={submitting}
              className="h-[28px] px-[10px] text-[12px] text-text-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={onCancel}
              disabled={submitting}
              className="h-[28px] px-[10px] text-[12px] text-text-muted hover:text-[#991B1B] dark:hover:text-[#F87171] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineModuleInput
// ─────────────────────────────────────────────────────────────────────────────
interface InlineModuleInputProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function InlineModuleInput({ onSubmit, onCancel }: InlineModuleInputProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      setSubmitting(true);
      await onSubmit(value.trim());
      setSubmitting(false);
    } else if (e.key === "Escape") onCancel();
  };

  const handleSave = async () => {
    if (value.trim()) {
      setSubmitting(true);
      await onSubmit(value.trim());
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[10px] p-[16px] border border-dashed border-border-custom rounded-[8px] bg-bg-page mb-[16px] animate-slide-down-in">
      <div className="flex items-center gap-[10px]">
        <span className="text-text-muted">{Icon.module}</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Module name…"
          disabled={submitting}
          className="flex-1 text-[13px] text-foreground font-medium bg-transparent outline-none placeholder-text-muted"
        />
      </div>
      <div className="flex items-center gap-[8px] ml-[24px]">
        <button
          onClick={handleSave}
          disabled={submitting || !value.trim()}
          className="h-[28px] px-[12px] rounded-[6px] bg-foreground text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97] cursor-pointer"
        >
          {submitting ? "Saving…" : "Save module"}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="h-[28px] px-[10px] text-[12px] text-text-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ModuleCard
// ─────────────────────────────────────────────────────────────────────────────
interface ModuleCardProps {
  collection: Collection;
  tasks: Task[];
  expandedTaskId: string | null;
  onToggleExpand: (id: string) => void;
  onToggleDone: (id: string) => void;
  onChangeStatus: (id: string, s: TaskStatus) => void;
  onSaveDescription: (id: string, d: string) => void;
  onSaveTitle: (id: string, title: string) => void;
  onChangePriority: (id: string, p: TaskPriority) => void;
  onSaveDueDate: (id: string, date: string | null) => void;
  onDeleteTask: (id: string) => void;
  members: WorkspaceMember[];
  onAssignUser: (taskId: string, a: { user_id: string; full_name: string | null; avatar_url: string | null }) => void;
  onUnassignUser: (taskId: string, userId: string) => void;
  addingTaskInModule: string | null;
  onStartAddTask: (collectionId: string) => void;
  onSubmitTask: (title: string, description: string) => Promise<void>;
  onCancelAddTask: () => void;
  onRenameCollection: (name: string) => Promise<void>;
  onDeleteCollection: () => Promise<void>;
  onAssignCollection: (userId: string) => Promise<void>;
  onUnassignCollection: (userId: string) => Promise<void>;
}

export function ModuleCard({
  collection, tasks, expandedTaskId,
  onToggleExpand, onToggleDone, onChangeStatus, onSaveDescription,
  onSaveTitle, onChangePriority, onSaveDueDate, onDeleteTask,
  members, onAssignUser, onUnassignUser,
  addingTaskInModule, onStartAddTask, onSubmitTask, onCancelAddTask,
  onRenameCollection, onDeleteCollection,
  onAssignCollection, onUnassignCollection,
}: ModuleCardProps) {
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isAddingHere = addingTaskInModule === collection.id;

  // Module rename state
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(collection.name);
  // 3-dot menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Assignee picker state
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const assignPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setNameDraft(collection.name); }, [collection.name]);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuOpen(false); setConfirmDel(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);
  useEffect(() => {
    if (!assignPickerOpen) return;
    const h = (e: MouseEvent) => { if (assignPickerRef.current && !assignPickerRef.current.contains(e.target as Node)) setAssignPickerOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [assignPickerOpen]);

  const commitRename = () => {
    setRenaming(false);
    if (nameDraft.trim() && nameDraft !== collection.name) onRenameCollection(nameDraft.trim());
    else setNameDraft(collection.name);
  };

  return (
    <div className="bg-bg-card border border-border-custom rounded-[8px] mb-[20px] md:mb-[24px] overflow-visible">
      {/* Header */}
      <div className="bg-bg-page px-[16px] py-[12px] border-b border-border-custom flex items-center justify-between rounded-t-[8px]">
        <div className="flex items-center gap-[8px] min-w-0 flex-1 mr-[8px]">
          <span className="text-foreground shrink-0">{Icon.module}</span>
          {renaming ? (
            <input
              autoFocus value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setRenaming(false); setNameDraft(collection.name); } }}
              className="flex-1 text-[13px] font-semibold text-foreground bg-bg-card border border-border-custom rounded-[4px] px-[6px] py-[2px] focus-glow min-w-0"
            />
          ) : (
            <span className="text-[13px] font-semibold text-foreground truncate" onDoubleClick={() => setRenaming(true)} title="Double-click to rename">{collection.name}</span>
          )}
        </div>
        <div className="flex items-center gap-[8px] shrink-0">
          <span className="text-[11px] font-medium text-text-muted">{done} / {total}</span>
          <div className="w-[48px] md:w-[64px] h-[3px] bg-border-custom rounded-full overflow-hidden">
            <div className="h-full bg-foreground rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={() => onStartAddTask(collection.id)}
            className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-text-muted hover:bg-bg-raised hover:text-foreground transition-all duration-150 active:scale-90"
            title="Add task">
            {Icon.plus}
          </button>
          {/* 3-dot menu */}
          <div ref={menuRef} className="relative">
            <button onClick={() => { setMenuOpen((v) => !v); setConfirmDel(false); }}
              className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-text-muted hover:bg-bg-raised hover:text-foreground transition-all duration-150 text-[16px] leading-none active:scale-90"
              title="Module options">···
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[160px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-border-custom rounded-[8px] py-[4px] overflow-hidden shadow-md">
                {!confirmDel ? (
                  <>
                    <button onClick={() => { setAssignPickerOpen(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-[8px] px-[12px] h-[34px] text-left text-[13px] hover:bg-bg-raised text-text-secondary hover:text-foreground transition-colors duration-100">
                      Assign users
                    </button>
                    <button onClick={() => { setRenaming(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-[8px] px-[12px] h-[34px] text-left text-[13px] hover:bg-bg-raised text-text-secondary hover:text-foreground transition-colors duration-100">
                      Rename
                    </button>
                    <button onClick={() => setConfirmDel(true)}
                      className="w-full flex items-center gap-[8px] px-[12px] h-[34px] text-left text-[13px] text-[#991B1B] dark:text-[#F87171] hover:bg-red-500/5 transition-colors duration-100">
                      Delete module
                    </button>
                  </>
                ) : (
                  <div className="px-[12px] py-[10px] flex flex-col gap-[8px]">
                    <p className="text-[12px] text-text-secondary leading-relaxed">Delete <strong>{collection.name}</strong> and all its tasks?</p>
                    <div className="flex gap-[6px]">
                      <button onClick={() => { onDeleteCollection(); setMenuOpen(false); }}
                        className="flex-1 h-[28px] rounded-[6px] bg-[#991B1B] dark:bg-red-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity">
                        Delete
                      </button>
                      <button onClick={() => setConfirmDel(false)}
                        className="flex-1 h-[28px] rounded-[6px] border border-border-custom text-[12px] font-medium hover:bg-bg-raised transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignees row */}
      {(collection.collection_assignees?.length > 0 || assignPickerOpen) && (
        <div className="px-[16px] py-[8px] border-b border-border-custom flex items-center gap-[8px] flex-wrap relative">
          <span className="text-[11px] text-text-muted shrink-0">Assigned:</span>
          <div className="flex items-center gap-[4px] flex-wrap">
            {(collection.collection_assignees ?? []).map((a) => (
              <span key={a.user_id} className="group inline-flex items-center gap-[6px] h-[24px] px-[8px] rounded-full bg-bg-raised text-[11px] text-text-secondary border border-border-custom">
                {a.profiles?.avatar_url ? (
                  <img src={a.profiles.avatar_url} className="w-[14px] h-[14px] rounded-full" alt="" />
                ) : (
                  <span className="w-[14px] h-[14px] rounded-full bg-border-custom flex items-center justify-center text-[9px] font-bold text-foreground">
                    {(a.profiles?.full_name || "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="truncate max-w-[80px]">{a.profiles?.full_name || "User"}</span>
                <button
                  onClick={() => onUnassignCollection(a.user_id)}
                  className="opacity-0 group-hover:opacity-100 ml-[2px] text-text-muted hover:text-[#991B1B] dark:hover:text-[#F87171] transition-opacity"
                  title="Remove"
                >×</button>
              </span>
            ))}
            <button
              onClick={() => setAssignPickerOpen((v) => !v)}
              className="w-[24px] h-[24px] rounded-full border border-dashed border-border-custom flex items-center justify-center text-text-muted hover:border-text-secondary hover:text-foreground transition-all text-[12px] active:scale-90"
              title="Assign user"
            >+</button>
          </div>

          {/* Assignee picker dropdown */}
          {assignPickerOpen && (
            <div ref={assignPickerRef} className="absolute left-[16px] top-[calc(100%+6px)] z-50 w-[200px] max-h-[200px] overflow-y-auto bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-border-custom rounded-[8px] py-[4px] shadow-md">
              {members.filter((m) => !(collection.collection_assignees ?? []).some((a) => a.user_id === m.user_id)).length === 0 ? (
                <p className="px-[12px] py-[8px] text-[12px] text-text-muted italic">All members assigned</p>
              ) : (
                members
                  .filter((m) => !(collection.collection_assignees ?? []).some((a) => a.user_id === m.user_id))
                  .map((m) => (
                    <button
                      key={m.user_id}
                      onClick={() => { onAssignCollection(m.user_id); setAssignPickerOpen(false); }}
                      className="w-full flex items-center gap-[8px] px-[12px] h-[34px] text-left text-[13px] hover:bg-bg-raised text-text-secondary hover:text-foreground transition-colors duration-100"
                    >
                      {m.avatar_url ? (
                        <img src={m.avatar_url} className="w-[18px] h-[18px] rounded-full" alt="" />
                      ) : (
                        <span className="w-[18px] h-[18px] rounded-full bg-border-custom flex items-center justify-center text-[10px] font-bold text-foreground">
                          {(m.full_name || "?")[0].toUpperCase()}
                        </span>
                      )}
                      <span className="truncate font-medium">{m.full_name || "User"}</span>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Task rows */}
      <div className="flex flex-col">
        {tasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            isLast={i === tasks.length - 1 && !isAddingHere}
            isExpanded={expandedTaskId === task.id}
            onToggleExpand={() => onToggleExpand(task.id)}
            onToggleDone={() => onToggleDone(task.id)}
            onChangeStatus={(s) => onChangeStatus(task.id, s)}
            onSaveDescription={(d) => onSaveDescription(task.id, d)}
            onSaveTitle={(t) => onSaveTitle(task.id, t)}
            onChangePriority={(p) => onChangePriority(task.id, p)}
            onSaveDueDate={(d) => onSaveDueDate(task.id, d)}
            onDelete={() => onDeleteTask(task.id)}
            members={members}
            onAssignUser={(a) => onAssignUser(task.id, a)}
            onUnassignUser={(uid) => onUnassignUser(task.id, uid)}
          />
        ))}
        {tasks.length === 0 && !isAddingHere && (
          <div className="px-[16px] py-[16px] text-[12px] text-text-muted italic bg-bg-page/20">No tasks yet — click + to add one.</div>
        )}
        {isAddingHere && (
          <InlineTaskInput onSubmit={onSubmitTask} onCancel={onCancelAddTask} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WelcomeState
// ─────────────────────────────────────────────────────────────────────────────
export function WelcomeState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-[16px] text-center px-[32px]">
      <div className="w-[56px] h-[56px] rounded-[14px] bg-bg-raised flex items-center justify-center text-text-muted">
        {Icon.inbox}
      </div>
      <div>
        <p className="text-[15px] font-semibold mb-[6px]">Select a project</p>
        <p className="text-[13px] text-text-muted max-w-[260px] leading-relaxed">
          Choose a project from the sidebar to view its tasks and modules.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyModulesState
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyModulesState({ onAddModule }: { onAddModule: () => void }) {
  return (
    <div className="bg-bg-card border border-border-custom rounded-[8px] p-[40px] md:p-[56px] flex flex-col items-center justify-center gap-[14px] text-center">
      <div className="w-[48px] h-[48px] rounded-[12px] bg-bg-raised flex items-center justify-center text-text-muted">
        {Icon.folder}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-foreground mb-[4px]">No modules yet</p>
        <p className="text-[12px] text-text-muted">Add a module to start organising tasks.</p>
      </div>
      <button
        onClick={onAddModule}
        className="mt-[4px] flex items-center gap-[7px] h-[34px] px-[16px] rounded-[6px] bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-all active:scale-[0.97] cursor-pointer"
      >
        {Icon.plus} Add first module
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonModules
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonModules() {
  return (
    <>
      {[1, 2].map((i) => (
        <div key={i} className="bg-bg-card border border-border-custom rounded-[8px] mb-[24px] overflow-hidden animate-pulse">
          <div className="bg-bg-page px-[16px] py-[12px] border-b border-border-custom flex items-center gap-[10px]">
            <div className="w-[14px] h-[14px] rounded-[3px] bg-border-custom" />
            <div className="w-[120px] h-[11px] rounded-[3px] bg-border-custom" />
          </div>
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center px-[16px] h-[44px] gap-[12px] border-b border-border-custom last:border-0">
              <div className="w-[16px] h-[16px] rounded-[4px] bg-border-custom shrink-0" />
              <div className="flex-1 h-[10px] rounded-[3px] bg-border-custom" />
              <div className="w-[60px] h-[18px] rounded-[4px] bg-border-custom" />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RightPanel
// ─────────────────────────────────────────────────────────────────────────────
interface RightPanelProps {
  members: WorkspaceMember[];
  membersLoading: boolean;
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  onInvite: () => void;
  currentUserId: string | null;
  onRemoveMember: (userId: string) => void;
}

export function RightPanel({ members, membersLoading, progressPercent, completedTasks, totalTasks, onInvite, currentUserId, onRemoveMember }: RightPanelProps) {
  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canRemove = currentMember?.role === "owner" || currentMember?.role === "admin";
  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 border-l border-border-custom bg-bg-panel flex-col p-[20px] transition-colors duration-100">
      <div className="mb-[32px]">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-[16px]">Team members</h3>
        <div className="flex flex-col gap-[12px]">
          {membersLoading && [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-[10px] animate-pulse">
              <div className="w-[24px] h-[24px] rounded-full bg-border-custom shrink-0" />
              <div className="flex-1 h-[10px] rounded-[3px] bg-border-custom" />
            </div>
          ))}
          {!membersLoading && members.map((m, i) => (
            <div key={m.user_id} className="flex items-center gap-[10px] group">
              {m.avatar_url ? (
                <img src={m.avatar_url} alt="" className="w-[24px] h-[24px] rounded-full object-cover shrink-0 border border-border-custom" />
              ) : (
                <div className={`w-[24px] h-[24px] rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[10px] font-bold flex items-center justify-center shrink-0 border border-border-custom`}>
                  {initials(m.full_name || m.email)}
                </div>
              )}
              <div className="text-[13px] font-medium text-foreground truncate flex-1">{m.full_name || m.email || "Unknown"}</div>
              {canRemove && m.user_id !== currentUserId && m.role !== "owner" && (
                <button
                  onClick={() => onRemoveMember(m.user_id)}
                  className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center text-text-muted hover:bg-red-500/5 hover:text-[#991B1B] dark:hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Remove member"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
          {!membersLoading && members.length === 0 && (
            <p className="text-[12px] text-text-muted italic">No members yet.</p>
          )}
        </div>
      </div>

      <div className="mb-[32px]">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-[12px]">Progress</h3>
        <div className="text-[20px] font-bold text-foreground mb-[8px]">{progressPercent}%</div>
        <div className="w-full h-[3px] bg-border-custom rounded-full overflow-hidden mb-[8px]">
          <div className="h-full bg-foreground rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="text-[11px] text-text-muted font-medium">
          {totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks done` : "No tasks yet"}
        </div>
      </div>

      <button onClick={onInvite} className="w-full h-[32px] rounded-[6px] border border-border-custom bg-bg-card text-foreground text-[13px] font-medium hover:bg-bg-raised transition-all duration-75 active:scale-[0.97] cursor-pointer">
        Invite member
      </button>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileSidebarDrawer
// ─────────────────────────────────────────────────────────────────────────────
interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileSidebarDrawer({ isOpen, onClose, children }: MobileSidebarDrawerProps) {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-bg-panel border-r border-border-custom flex flex-col lg:hidden"
        style={{ animation: "slideInLeft 0.15s ease-out" }}
      >
        <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-border-custom">
          <div className="flex items-center gap-[8px]">
            <img
              src="/Dineezy_desk_logo.png"
              alt="Dineezy Logo"
              className="w-[20px] h-[20px] object-contain rounded-[4px] dark:invert"
            />
            <span className="text-[14px] font-semibold tracking-tight text-foreground">Dineezy Desk</span>
          </div>
          <button onClick={onClose} className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-text-muted hover:bg-bg-raised hover:text-foreground">
            {Icon.x}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
