"use client";

import React from "react";
import { type ProjectItem } from "../hooks/useProjects";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ProjectItem["status"],
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-[#22C55E]",
    badgeClass:
      "bg-[#DCFCE7] dark:bg-[rgba(34,197,94,0.15)] text-[#15803D] dark:text-[#4ADE80]",
  },
  archived: {
    label: "Archived",
    dotClass: "bg-[#A1A1AA]",
    badgeClass:
      "bg-[#F4F4F5] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA]",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-[#3B82F6]",
    badgeClass:
      "bg-[#DBEAFE] dark:bg-[rgba(59,130,246,0.15)] text-[#1D4ED8] dark:text-[#60A5FA]",
  },
};

const folderIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const plusIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProjectViewProps {
  project: ProjectItem;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProjectView({ project }: ProjectViewProps) {
  const status = STATUS_CONFIG[project.status];

  return (
    <main
      className="flex-1 overflow-y-auto p-[32px] transition-colors duration-150"
      style={{ animation: "fadeSlideIn 0.18s ease-out" }}
    >
      {/* Project header */}
      <div className="mb-[32px]">
        <div className="flex items-start gap-[14px]">
          {/* Emoji badge */}
          <div
            className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center text-[26px] shrink-0 border border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#09090B]"
            style={project.color ? { boxShadow: `0 0 0 3px ${project.color}22` } : {}}
          >
            {project.emoji}
          </div>

          <div className="flex-1 min-w-0 pt-[2px]">
            <h1 className="text-[20px] font-semibold text-[#09090B] dark:text-[#FAFAFA] mb-[8px] truncate">
              {project.name}
            </h1>
            <div className="flex items-center gap-[8px] flex-wrap">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-[5px] text-[11px] font-medium px-[8px] py-[3px] rounded-[5px] ${status.badgeClass}`}>
                <span className={`w-[5px] h-[5px] rounded-full ${status.dotClass}`} />
                {status.label}
              </span>

              {/* Color swatch */}
              {project.color && (
                <span
                  className="w-[12px] h-[12px] rounded-full inline-block border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]"
                  style={{ backgroundColor: project.color }}
                />
              )}

              {/* Created date */}
              <span className="text-[12px] text-[#A1A1AA]">
                Created{" "}
                {new Date(project.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-[13px] text-[#52525B] dark:text-[#A1A1AA] mt-[10px] leading-relaxed max-w-[600px]">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E4E4E7] dark:border-[#27272A] mb-[28px]" />

      {/* Empty tasks state */}
      <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[10px] p-[56px] flex flex-col items-center justify-center gap-[14px] text-center">
        <div className="w-[48px] h-[48px] rounded-[12px] bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center text-[#A1A1AA] dark:text-[#52525B]">
          {folderIcon}
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#09090B] dark:text-[#FAFAFA] mb-[4px]">
            No tasks yet
          </p>
          <p className="text-[12px] text-[#A1A1AA]">
            Tasks and collections for this project will appear here.
          </p>
        </div>
        <button className="mt-[4px] flex items-center gap-[7px] h-[34px] px-[16px] rounded-[8px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity duration-100">
          {plusIcon}
          Add first task
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
