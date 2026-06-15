"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/theme-toggle';
import { superbase } from '../../utils/supabase_client';
import { CreateWorkspaceModal, type Workspace } from '../components/create-workspace-modal';
import { CreateProjectModal } from '../components/create-project-modal';
import { ProjectView } from '../components/project-view';
import { useWorkspaces, type WorkspaceItem } from '../hooks/useWorkspaces';
import { useProjects, type ProjectItem } from '../hooks/useProjects';
const icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  checkbox: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  chevronRight: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  check: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  module: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="4" y="9" width="16" height="6" /><line x1="10" y1="4" x2="10" y2="20" /></svg>,
  logo: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M9 12l2 2 4-4" /></svg>,
  signout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
};

export default function Dashboard() {
  const router = useRouter();

  // ── Workspace data (real DB fetch) ────────────────────────────────────────────
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    addWorkspace,
    loading: wsLoading,
    error: wsError,
    refetch: refetchWorkspaces,
  } = useWorkspaces();

  // ── Active view: dashboard overview OR a specific project ────────────────────
  type ActiveView = { type: 'dashboard' } | { type: 'project'; project: ProjectItem };
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'dashboard' });

  // Reset to dashboard overview whenever the workspace changes
  const handleSetActiveWorkspace = useCallback((ws: WorkspaceItem) => {
    setActiveWorkspace(ws);
    setActiveView({ type: 'dashboard' });
  }, [setActiveWorkspace]);

  // ── Workspace dropdown state ────────────────────────────────────────────
  const [wsOpen, setWsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  // ── Projects for the active workspace ─────────────────────────────────
  const {
    projects,
    loading: projLoading,
    error: projError,
    addProject,
  } = useProjects(activeWorkspace?.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setWsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auth check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await superbase.auth.getSession();
      if (!session) router.replace('/login');
    };
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await superbase.auth.signOut();
    router.replace('/login');
  };

  // ── Workspace created ────────────────────────────────────────────────────────
  const handleWorkspaceCreated = useCallback((ws: Workspace) => {
    const item: WorkspaceItem = {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      emoji: ws.emoji,
      description: ws.description,
      created_at: ws.created_at,
      member_count: 1,
    };
    addWorkspace(item);
    setCreateModalOpen(false);
    setWsOpen(false);
  }, [addWorkspace]);

  // ── Project created ────────────────────────────────────────────────────────
  const handleProjectCreated = useCallback((project: ProjectItem) => {
    addProject(project);
    setCreateProjectOpen(false);
  }, [addProject]);

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] dark:bg-[#000000] font-sans text-[#09090B] dark:text-[#FAFAFA] transition-colors duration-150">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#09090B] flex flex-col transition-colors duration-150">
        {/* Logo Area */}
        <div className="flex items-center gap-[12px] px-[20px] py-[20px]">
          <div className="w-[24px] h-[24px] rounded-[6px] bg-[#09090B] dark:bg-[#FAFAFA] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="stroke-white dark:stroke-[#09090B]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M9 12l2 2 4-4" /></svg>
          </div>
          <span className="text-[14px] font-medium text-[#09090B] dark:text-[#FAFAFA]">Dineezy Desk</span>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-[24px] px-[12px]">
          {/* Navigation Section */}
          <div className="flex flex-col">
            <h3 className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider mb-[8px] pl-[8px]">Navigation</h3>
            <div className="flex flex-col gap-[2px]">
              <a href="#" className="flex items-center gap-[10px] h-[36px] px-[8px] rounded-[6px] bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] font-medium transition-colors duration-100">
                <span className="opacity-100">{icons.dashboard}</span>
                <span className="text-[13px]">Dashboard</span>
              </a>
              <a href="#" className="flex items-center gap-[10px] h-[36px] px-[8px] rounded-[6px] text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100">
                <span className="opacity-70">{icons.checkbox}</span>
                <span className="text-[13px]">My tasks</span>
              </a>
              <a href="#" className="flex items-center gap-[10px] h-[36px] px-[8px] rounded-[6px] text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100">
                <span className="opacity-70">{icons.chart}</span>
                <span className="text-[13px]">Analytics</span>
              </a>
              <a href="#" className="flex items-center gap-[10px] h-[36px] px-[8px] rounded-[6px] text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100">
                <span className="opacity-70">{icons.users}</span>
                <span className="text-[13px]">Team</span>
              </a>
            </div>
          </div>

          {/* Projects Section */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-[8px] pl-[8px] pr-[4px]">
              <h3 className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Projects</h3>
              {!wsLoading && activeWorkspace && (
                <span className="text-[11px] text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#18181B] px-[5px] py-[1px] rounded-[3px]">
                  {projects.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-[2px]">
              {/* Loading skeletons */}
              {projLoading && [1, 2].map(i => (
                <div key={i} className="flex items-center gap-[8px] h-[36px] px-[8px] animate-pulse">
                  <div className="w-[14px] h-[14px] rounded-[3px] bg-[#E4E4E7] dark:bg-[#27272A] shrink-0" />
                  <div className="flex-1 h-[10px] rounded-[3px] bg-[#E4E4E7] dark:bg-[#27272A]" />
                </div>
              ))}
              {/* Error */}
              {!projLoading && projError && (
                <p className="text-[11px] text-[#991B1B] dark:text-[#F87171] px-[8px] py-[4px]">
                  Failed to load projects.
                </p>
              )}
              {/* Empty state */}
              {!projLoading && !projError && activeWorkspace && projects.length === 0 && (
                <p className="text-[11px] text-[#A1A1AA] px-[8px] py-[4px] italic">No projects yet.</p>
              )}
              {/* Project list */}
              {!projLoading && !projError && projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setActiveView({ type: 'project', project })}
                  className={`w-full flex items-center gap-[8px] h-[36px] px-[8px] rounded-[6px] text-left transition-colors duration-100 group ${
                    activeView.type === 'project' && activeView.project.id === project.id
                      ? 'bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA]'
                      : 'text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  <span className="text-[14px] leading-none shrink-0">{project.emoji}</span>
                  <span className="text-[13px] truncate flex-1">{project.name}</span>
                  {project.color && (
                    <span
                      className="w-[6px] h-[6px] rounded-full shrink-0 opacity-60 group-hover:opacity-100"
                      style={{ backgroundColor: project.color }}
                    />
                  )}
                </button>
              ))}
              {/* New project button */}
              <button
                onClick={() => activeWorkspace && setCreateProjectOpen(true)}
                disabled={!activeWorkspace}
                className="flex items-center gap-[8px] h-[32px] px-[8px] rounded-[6px] text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100 mt-[2px] disabled:opacity-40 disabled:cursor-not-allowed w-full text-left"
              >
                <span>{icons.plus}</span>
                <span className="text-[13px]">New project</span>
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="h-[56px] border-b border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#09090B] flex items-center justify-between px-[24px] shrink-0 transition-colors duration-150 z-20 overflow-visible">
          {/* Left: workspace switcher + breadcrumb */}
          <div className="flex items-center gap-[8px] text-[13px] min-w-0">
            {/* Workspace Switcher */}
            <div ref={wsRef} className="relative flex items-center text-[13px]">

            {/* ── Trigger button ── */}
            {wsLoading ? (
              // Skeleton while loading
              <div className="flex items-center gap-[8px] h-[32px] px-[10px] rounded-[6px] animate-pulse">
                <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E4E4E7] dark:bg-[#27272A]" />
                <div className="w-[90px] h-[12px] rounded-[4px] bg-[#E4E4E7] dark:bg-[#27272A]" />
              </div>
            ) : (
              <button
                id="workspace-switcher-btn"
                onClick={() => setWsOpen(v => !v)}
                className="flex items-center gap-[8px] h-[32px] px-[10px] rounded-[6px] text-[#09090B] dark:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 select-none"
              >
                {activeWorkspace ? (
                  <>
                    <span className="text-[16px] leading-none">{activeWorkspace.emoji}</span>
                    <span className="font-medium text-[13px] max-w-[140px] truncate">{activeWorkspace.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[16px] leading-none">🏢</span>
                    <span className="font-medium text-[13px] text-[#A1A1AA]">Select workspace</span>
                  </>
                )}
                <span className={`transition-transform duration-200 ${wsOpen ? 'rotate-180' : 'rotate-0'}`}>
                  {icons.chevronDown}
                </span>
              </button>
            )}

            {/* ── Dropdown ── */}
            {wsOpen && (
              <div
                id="workspace-dropdown"
                className="absolute top-[calc(100%+8px)] left-0 w-[260px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-[12px] py-[10px] border-b border-[#E4E4E7] dark:border-[#27272A]">
                  <p className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Workspaces</p>
                </div>

                {/* ── Loading skeletons ── */}
                {wsLoading && (
                  <div className="py-[6px] flex flex-col gap-[2px]">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-[10px] px-[12px] h-[42px] animate-pulse">
                        <div className="w-[28px] h-[28px] rounded-[6px] bg-[#E4E4E7] dark:bg-[#27272A] shrink-0" />
                        <div className="flex flex-col gap-[4px] flex-1">
                          <div className="w-[100px] h-[10px] rounded-[3px] bg-[#E4E4E7] dark:bg-[#27272A]" />
                          <div className="w-[60px] h-[8px] rounded-[3px] bg-[#E4E4E7] dark:bg-[#27272A]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Fetch error + retry ── */}
                {!wsLoading && wsError && (
                  <div className="px-[12px] py-[14px] flex items-start gap-[8px]">
                    <svg className="shrink-0 mt-[1px] text-[#991B1B] dark:text-[#F87171]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div className="flex flex-col gap-[6px]">
                      <p className="text-[12px] text-[#52525B] dark:text-[#A1A1AA]">Failed to load workspaces.</p>
                      <button
                        onClick={refetchWorkspaces}
                        className="text-[12px] font-medium text-[#09090B] dark:text-[#FAFAFA] underline underline-offset-2 text-left"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Empty state ── */}
                {!wsLoading && !wsError && workspaces.length === 0 && (
                  <div className="px-[12px] py-[20px] flex flex-col items-center gap-[10px] text-center">
                    <div className="w-[36px] h-[36px] rounded-[8px] bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center text-[18px]">
                      🏢
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#09090B] dark:text-[#FAFAFA]">No workspaces yet</p>
                      <p className="text-[11px] text-[#A1A1AA] mt-[2px]">Create one to get started</p>
                    </div>
                    <button
                      onClick={() => { setWsOpen(false); setCreateModalOpen(true); }}
                      className="h-[30px] px-[14px] rounded-[6px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[12px] font-medium hover:opacity-90 transition-opacity duration-100"
                    >
                      Create Workspace
                    </button>
                  </div>
                )}

                {/* ── Workspace list ── */}
                {!wsLoading && !wsError && workspaces.length > 0 && (
                  <div className="py-[6px]">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => { handleSetActiveWorkspace(ws); setWsOpen(false); }}
                        className={`w-full flex items-center gap-[10px] px-[12px] h-[42px] text-left hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 ${activeWorkspace?.id === ws.id ? 'bg-[#F4F4F5] dark:bg-[#18181B]' : ''}`}
                      >
                        <span className="w-[28px] h-[28px] rounded-[6px] bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center text-[14px] shrink-0 border border-[#E4E4E7] dark:border-[#27272A]">
                          {ws.emoji}
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-[#09090B] dark:text-[#FAFAFA] truncate">{ws.name}</span>
                          <span className="text-[11px] text-[#A1A1AA] truncate">
                            {ws.member_count} member{ws.member_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {activeWorkspace?.id === ws.id && (
                          <span className="text-[#09090B] dark:text-[#FAFAFA] shrink-0">{icons.check}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Divider + Create button (always shown unless loading) ── */}
                {!wsLoading && workspaces.length > 0 && (
                  <>
                    <div className="border-t border-[#E4E4E7] dark:border-[#27272A]" />
                    <div className="py-[6px]">
                      <button
                        id="create-workspace-btn"
                        className="w-full flex items-center gap-[10px] px-[12px] h-[38px] text-left hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100"
                        onClick={() => { setWsOpen(false); setCreateModalOpen(true); }}
                      >
                        <span className="w-[28px] h-[28px] rounded-[6px] border border-dashed border-[#A1A1AA] dark:border-[#52525B] flex items-center justify-center shrink-0">
                          {icons.plus}
                        </span>
                        <span className="text-[13px] font-medium text-[#52525B] dark:text-[#A1A1AA]">Create Workspace</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>

            {/* Breadcrumb: only shown when a project is active */}
            {activeView.type === 'project' && (
              <>
                <span className="text-[#D4D4D8] dark:text-[#3F3F46]">/</span>
                <button
                  onClick={() => setActiveView({ type: 'dashboard' })}
                  className="flex items-center gap-[6px] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100 max-w-[180px] truncate"
                >
                  <span className="text-[15px] leading-none shrink-0">{activeView.project.emoji}</span>
                  <span className="text-[13px] font-medium truncate">{activeView.project.name}</span>
                </button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-[8px]">
            <ThemeToggle />
            <button className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[6px] bg-transparent text-[#09090B] dark:text-[#FAFAFA] text-[13px] font-medium border border-[#E4E4E7] dark:border-[#27272A] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100">
              Filter
            </button>
            <button className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[6px] bg-transparent text-[#09090B] dark:text-[#FAFAFA] text-[13px] font-medium border border-[#E4E4E7] dark:border-[#27272A] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100">
              Members
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[6px] bg-transparent text-[#991B1B] dark:text-[#F87171] text-[13px] font-medium border border-[#FECACA] dark:border-[rgba(239,68,68,0.3)] hover:bg-[#FEF2F2] dark:hover:bg-[rgba(239,68,68,0.08)] transition-colors duration-100"
            >
              {icons.signout}
              Sign out
            </button>
            <button className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[6px] bg-[#09090B] dark:bg-[#FAFAFA] hover:opacity-90 text-white dark:text-[#09090B] text-[13px] font-medium transition-all duration-75">
              <span className="scale-90">{icons.plus}</span>
              Add task
            </button>
          </div>
        </header>

        {/* Scrollable Content — switches between dashboard overview and project view */}
        {activeView.type === 'project' ? (
          <ProjectView project={activeView.project} />
        ) : (
          <main className="flex-1 overflow-y-auto p-[32px] transition-colors duration-150">
          {/* Dashboard Header */}
          <div className="mb-[32px]">
            <h1 className="text-[20px] font-semibold text-[#09090B] dark:text-[#FAFAFA] mb-[8px]">Website Redesign</h1>
            <div className="flex items-center gap-[8px] text-[12px] text-[#52525B] dark:text-[#A1A1AA]">
              <span>Due Jun 30</span>
              <span>·</span>
              <span>5 members</span>
              <span>·</span>
              <span className="text-[#09090B] dark:text-[#FAFAFA] font-medium">68% complete</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-[16px] mb-[32px]">
            {/* Stat Card 1 */}
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] p-[16px] transition-colors duration-150">
              <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] mb-[8px]">Total tasks</div>
              <div className="text-[20px] font-medium text-[#09090B] dark:text-[#FAFAFA] mb-[4px]">24</div>
              <div className="text-[11px] text-[#A1A1AA]">across 3 modules</div>
            </div>
            {/* Stat Card 2 */}
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] p-[16px] transition-colors duration-150">
              <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] mb-[8px]">In progress</div>
              <div className="text-[20px] font-medium text-[#09090B] dark:text-[#FAFAFA] mb-[4px]">7</div>
              <div className="text-[11px] text-[#92400E] dark:text-[#FBBF24]">2 overdue</div>
            </div>
            {/* Stat Card 3 */}
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] p-[16px] transition-colors duration-150">
              <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] mb-[8px]">Completed</div>
              <div className="text-[20px] font-medium text-[#09090B] dark:text-[#FAFAFA] mb-[4px]">14</div>
              <div className="text-[11px] text-[#A1A1AA]">this sprint</div>
            </div>
            {/* Stat Card 4 */}
            <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] p-[16px] transition-colors duration-150">
              <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] mb-[8px]">Unassigned</div>
              <div className="text-[20px] font-medium text-[#09090B] dark:text-[#FAFAFA] mb-[4px]">3</div>
              <div className="text-[11px] text-[#A1A1AA]">needs owner</div>
            </div>
          </div>

          {/* Modules Header */}
          <div className="flex items-center gap-[8px] mb-[16px]">
            <h2 className="text-[14px] font-medium text-[#09090B] dark:text-[#FAFAFA]">Modules</h2>
            <span className="bg-[#F4F4F5] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] text-[11px] px-[6px] py-[2px] rounded-[4px] font-medium">3</span>
          </div>

          {/* Module 1: Design System */}
          <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] mb-[24px] overflow-hidden transition-colors duration-150">
            {/* Module Header */}
            <div className="bg-[#FAFAFA] dark:bg-[#09090B] px-[16px] py-[12px] border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between transition-colors duration-150">
              <div className="flex items-center gap-[8px]">
                <span className="text-[#09090B] dark:text-[#FAFAFA]">{icons.module}</span>
                <span className="text-[13px] font-medium text-[#09090B] dark:text-[#FAFAFA]">Design System</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <span className="text-[11px] text-[#A1A1AA]">6 / 8 tasks</span>
                <div className="w-[64px] h-[3px] bg-[#E4E4E7] dark:bg-[#27272A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#09090B] dark:bg-[#FAFAFA] w-[75%] rounded-full transition-all duration-600 ease-out"></div>
                </div>
              </div>
            </div>

            {/* Task Rows */}
            <div className="flex flex-col">
              {/* Task 1 */}
              <div className="flex items-center px-[16px] h-[40px] border-b border-[#E4E4E7] dark:border-[#27272A] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 group">
                <div className="w-[14px] h-[14px] rounded-[4px] bg-[#09090B] dark:bg-[#FAFAFA] flex items-center justify-center mr-[12px] shrink-0 opacity-60">
                  <span className="text-white dark:text-[#09090B] scale-75">{icons.check}</span>
                </div>
                <div className="flex-1 text-[13px] text-[#09090B] dark:text-[#FAFAFA] line-through opacity-60">Define color tokens & typography scale</div>
                <div className="flex items-center gap-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-100 sm:opacity-100">
                  <span className="bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">High</span>
                  <span className="bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">Done</span>
                  <div className="flex items-center">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] text-[9px] font-medium flex items-center justify-center border-[1.5px] border-white dark:border-[#0A0A0A] z-10">AR</div>
                    <div className="w-[20px] h-[20px] rounded-full bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399] text-[9px] font-medium flex items-center justify-center border-[1.5px] border-white dark:border-[#0A0A0A] -ml-[6px] z-0">VK</div>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA] w-[44px] text-right">Jun 12</span>
                </div>
              </div>
              {/* Task 2 */}
              <div className="flex items-center px-[16px] h-[40px] border-b border-[#E4E4E7] dark:border-[#27272A] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 group">
                <div className="w-[14px] h-[14px] rounded-[4px] border border-[#A1A1AA] dark:border-[#52525B] mr-[12px] shrink-0 group-hover:border-[#09090B] dark:group-hover:border-[#FAFAFA] transition-colors duration-100"></div>
                <div className="flex-1 text-[13px] text-[#09090B] dark:text-[#FAFAFA]">Build component library in Figma</div>
                <div className="flex items-center gap-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-100 sm:opacity-100">
                  <span className="bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">High</span>
                  <span className="bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">In progress</span>
                  <div className="flex items-center">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] text-[9px] font-medium flex items-center justify-center border-[1.5px] border-white dark:border-[#0A0A0A]">AR</div>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA] w-[44px] text-right">Jun 18</span>
                </div>
              </div>
              {/* Task 3 */}
              <div className="flex items-center px-[16px] h-[40px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 group">
                <div className="w-[14px] h-[14px] rounded-[4px] border border-[#A1A1AA] dark:border-[#52525B] mr-[12px] shrink-0 group-hover:border-[#09090B] dark:group-hover:border-[#FAFAFA] transition-colors duration-100"></div>
                <div className="flex-1 text-[13px] text-[#09090B] dark:text-[#FAFAFA]">Document component usage guidelines</div>
                <div className="flex items-center gap-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-100 sm:opacity-100">
                  <span className="bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.15)] text-[#92400E] dark:text-[#FBBF24] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">Medium</span>
                  <span className="bg-[#FAFAFA] dark:bg-[#09090B] text-[#52525B] dark:text-[#A1A1AA] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px] border border-[#E4E4E7] dark:border-transparent">To do</span>
                  <div className="flex items-center">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171] text-[9px] font-medium flex items-center justify-center border-[1.5px] border-white dark:border-[#0A0A0A]">SK</div>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA] w-[44px] text-right">Jun 22</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Frontend Development */}
          <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[8px] mb-[24px] overflow-hidden transition-colors duration-150">
            {/* Module Header */}
            <div className="bg-[#FAFAFA] dark:bg-[#09090B] px-[16px] py-[12px] border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between transition-colors duration-150">
              <div className="flex items-center gap-[8px]">
                <span className="text-[#09090B] dark:text-[#FAFAFA]">{icons.module}</span>
                <span className="text-[13px] font-medium text-[#09090B] dark:text-[#FAFAFA]">Frontend Development</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <span className="text-[11px] text-[#A1A1AA]">3 / 9 tasks</span>
                <div className="w-[64px] h-[3px] bg-[#E4E4E7] dark:bg-[#27272A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#09090B] dark:bg-[#FAFAFA] w-[33%] rounded-full transition-all duration-600 ease-out"></div>
                </div>
              </div>
            </div>

            {/* Task Rows */}
            <div className="flex flex-col">
              {/* Task 1 */}
              <div className="flex items-center px-[16px] h-[40px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100 group">
                <div className="w-[14px] h-[14px] rounded-[4px] bg-[#09090B] dark:bg-[#FAFAFA] flex items-center justify-center mr-[12px] shrink-0 opacity-60">
                  <span className="text-white dark:text-[#09090B] scale-75">{icons.check}</span>
                </div>
                <div className="flex-1 text-[13px] text-[#09090B] dark:text-[#FAFAFA] line-through opacity-60">Set up Next.js project structure</div>
                <div className="flex items-center gap-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-100 sm:opacity-100">
                  <span className="bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">High</span>
                  <span className="bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399] text-[11px] font-medium px-[6px] py-[2px] rounded-[4px]">Done</span>
                  <div className="flex items-center">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399] text-[9px] font-medium flex items-center justify-center border-[1.5px] border-white dark:border-[#0A0A0A]">VK</div>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA] w-[44px] text-right">Jun 10</span>
                </div>
              </div>
            </div>
          </div>

        </main>
        )}
      </div>

      {/* Context Panel */}
      <aside className="w-[220px] shrink-0 border-l border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#09090B] flex flex-col p-[20px] transition-colors duration-150">
        {/* Team Members Section */}
        <div className="mb-[32px]">
          <h3 className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider mb-[16px]">Team members</h3>

          <div className="flex flex-col gap-[12px]">
            {/* Member 1 */}
            <div className="flex items-center gap-[10px]">
              <div className="w-[24px] h-[24px] rounded-full bg-[#F4F4F5] dark:bg-[#18181B] text-[#09090B] dark:text-[#FAFAFA] text-[10px] font-medium flex items-center justify-center shrink-0">AR</div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[13px] text-[#09090B] dark:text-[#FAFAFA] truncate">Arjun Rao</div>
              </div>
            </div>

            {/* Member 2 */}
            <div className="flex items-center gap-[10px]">
              <div className="w-[24px] h-[24px] rounded-full bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.15)] text-[#065F46] dark:text-[#34D399] text-[10px] font-medium flex items-center justify-center shrink-0">VK</div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[13px] text-[#09090B] dark:text-[#FAFAFA] truncate">Vikram K.</div>
              </div>
            </div>

            {/* Member 3 */}
            <div className="flex items-center gap-[10px]">
              <div className="w-[24px] h-[24px] rounded-full bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171] text-[10px] font-medium flex items-center justify-center shrink-0">SK</div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[13px] text-[#09090B] dark:text-[#FAFAFA] truncate">Sneha K.</div>
              </div>
            </div>

            {/* Member 4 */}
            <div className="flex items-center gap-[10px]">
              <div className="w-[24px] h-[24px] rounded-full bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.15)] text-[#92400E] dark:text-[#FBBF24] text-[10px] font-medium flex items-center justify-center shrink-0">NP</div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[13px] text-[#09090B] dark:text-[#FAFAFA] truncate">Neha P.</div>
              </div>
            </div>

            {/* Member 5 */}
            <div className="flex items-center gap-[10px]">
              <div className="w-[24px] h-[24px] rounded-full bg-[#EEF2FF] dark:bg-[rgba(99,102,241,0.15)] text-[#3730A3] dark:text-[#818CF8] text-[10px] font-medium flex items-center justify-center shrink-0">RJ</div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[13px] text-[#09090B] dark:text-[#FAFAFA] truncate">Rahul J.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Progress Section */}
        <div className="mb-[32px]">
          <h3 className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider mb-[12px]">Progress</h3>
          <div className="text-[20px] font-medium text-[#09090B] dark:text-[#FAFAFA] mb-[8px]">68%</div>
          <div className="w-full h-[3px] bg-[#E4E4E7] dark:bg-[#27272A] rounded-full overflow-hidden mb-[8px]">
            <div className="h-full bg-[#09090B] dark:bg-[#FAFAFA] w-[68%] rounded-full transition-all duration-600 ease-out"></div>
          </div>
          <div className="text-[11px] text-[#A1A1AA]">14 of 24 tasks done</div>
        </div>

        {/* Invite Button */}
        <button className="w-full h-[32px] rounded-[6px] bg-transparent border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-[#FAFAFA] text-[13px] font-medium hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors duration-100">
          Invite member
        </button>

      </aside>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
      />

      {/* Create Project Modal */}
      {activeWorkspace && (
        <CreateProjectModal
          isOpen={createProjectOpen}
          workspaceId={activeWorkspace.id}
          onClose={() => setCreateProjectOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>



  );
}
