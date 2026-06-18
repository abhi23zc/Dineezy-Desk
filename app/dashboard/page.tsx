"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/theme-toggle";
import { superbase } from "../../utils/supabase_client";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useWorkspaces, type WorkspaceItem } from "../hooks/useWorkspaces";
import { useProjects, type ProjectItem } from "../hooks/useProjects";
import { useCollections } from "../hooks/useCollections";
import { useTasks, type TaskStatus } from "../hooks/useTasks";
import { useWorkspaceMembers } from "../hooks/useWorkspaceMembers";

// ── Modals ────────────────────────────────────────────────────────────────────
import { CreateWorkspaceModal, type Workspace } from "../components/create-workspace-modal";
import { CreateProjectModal } from "../components/create-project-modal";
import { WorkspaceSettingsModal } from "../components/workspace-settings-modal";
import { ProjectSettingsModal } from "../components/project-settings-modal";
import { InviteMemberModal } from "../components/invite-member-modal";
import { Onboarding } from "../components/onboarding";

// ── Dashboard UI components ───────────────────────────────────────────────────
import {
  Icon,
  StatsRow,
  ModuleCard,
  InlineModuleInput,
  WelcomeState,
  EmptyModulesState,
  SkeletonModules,
  RightPanel,
  MobileSidebarDrawer,
} from "../components/dashboard-ui";

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG icons used only in this file
// ─────────────────────────────────────────────────────────────────────────────
const icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  checkbox: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  check: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  signout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  // ── Auth guard ───────────────────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  useEffect(() => {
    superbase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
      else {
        setCurrentUserId(session.user.id);
        setCurrentUserName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || null);
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    await superbase.auth.signOut();
    router.replace("/login");
  };

  // ── Workspace data ────────────────────────────────────────────────────────
  const {
    workspaces, activeWorkspace, setActiveWorkspace,
    addWorkspace, updateWorkspace, deleteWorkspace,
    loading: wsLoading, error: wsError, refetch: refetchWorkspaces,
  } = useWorkspaces();

  // ── Projects for active workspace ─────────────────────────────────────────
  const { projects, loading: projLoading, error: projError, addProject, updateProject, deleteProject } = useProjects(activeWorkspace?.id);

  // ── Active project selection ───────────────────────────────────────────────
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  // Reset active project whenever workspace changes
  const handleSetActiveWorkspace = useCallback((ws: WorkspaceItem) => {
    setActiveWorkspace(ws);
    setActiveProject(null);
  }, [setActiveWorkspace]);

  // ── Collections for active project ────────────────────────────────────────
  const { collections, loading: colLoading, addCollection, updateCollectionName, deleteCollection, assignCollection, unassignCollection } = useCollections(activeProject?.id);

  // ── Tasks for all collections in active project ───────────────────────────
  const collectionIds = useMemo(() => collections.map((c) => c.id), [collections]);
  const { tasks, stats, loading: tasksLoading, addTask, updateTaskStatus, updateTaskDescription, updateTaskTitle, updateTaskPriority, updateTaskDueDate, deleteTask, assignUser, unassignUser } = useTasks(collectionIds);

  // ── Workspace members (right panel) ───────────────────────────────────────
  const { members, loading: membersLoading, refetch: refetchMembers, removeMember } = useWorkspaceMembers(activeWorkspace?.id);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [wsOpen, setWsOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projSettingsOpen, setProjSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [addingTaskInModule, setAddingTaskInModule] = useState<string | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setActiveProject(projects?.[0] || null)
  }, [projects])

  // ── Task inline submit ────────────────────────────────────────────────────
  const handleSubmitTask = useCallback(async (title: string, description: string) => {
    if (!addingTaskInModule) return;
    const { data: { session } } = await superbase.auth.getSession();
    if (!session) return;

    const { data, error } = await superbase
      .from("tasks")
      .insert({
        collection_id: addingTaskInModule,
        title,
        description: description || null,
        status: "todo",
        priority: "medium",
        position: tasks.filter((t) => t.collection_id === addingTaskInModule).length,
        created_by: session.user.id,
      })
      .select("id, collection_id, title, description, status, priority, due_date, position, created_at")
      .single();

    if (!error && data) {
      addTask({ ...(data as Parameters<typeof addTask>[0]), assignees: [] });
    }
    setAddingTaskInModule(null);
  }, [addingTaskInModule, tasks, addTask]);

  // ── Module inline submit ──────────────────────────────────────────────────
  const handleSubmitModule = useCallback(async (name: string) => {
    if (!activeProject) return;
    const { data: { session } } = await superbase.auth.getSession();
    if (!session) return;

    const { data, error } = await superbase
      .from("collections")
      .insert({
        project_id: activeProject.id,
        name,
        position: collections.length,
        created_by: session.user.id,
      })
      .select("id, project_id, name, description, position, created_at")
      .single();

    if (!error && data) addCollection(data as Parameters<typeof addCollection>[0]);
    setAddingModule(false);
  }, [activeProject, collections.length, addCollection]);

  // ── Workspace created callback ────────────────────────────────────────────
  const handleWorkspaceCreated = useCallback((workspace: Workspace) => {
    addWorkspace({ ...workspace, member_count: 1 });
    setCreateWorkspaceOpen(false);
    setWsOpen(false);
  }, [addWorkspace]);

  // ── Project created callback ──────────────────────────────────────────────
  const handleProjectCreated = useCallback((project: ProjectItem) => {
    addProject(project);
    setActiveProject(project);
    setCreateProjectOpen(false);
  }, [addProject]);

  // ── Task expand toggle ────────────────────────────────────────────────────
  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  // ── Content loading state ─────────────────────────────────────────────────
  const isContentLoading = colLoading || tasksLoading;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (!currentUserId) return null;

  if (!wsLoading && workspaces.length === 0) {
    return (
      <Onboarding
        userId={currentUserId}
        userName={currentUserName}
        onComplete={() => { refetchWorkspaces(); }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-page text-foreground font-sans transition-colors duration-100">

      {/* ── Sidebar (desktop only) ──────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[220px] shrink-0 border-r border-border-custom bg-bg-panel flex-col transition-colors duration-100">
        {/* Logo */}
        <div className="flex items-center gap-[10px] px-[20px] py-[20px]">
          <img
            src="/Dineezy_desk_logo.png"
            alt="Dineezy Logo"
            className="w-[24px] h-[24px] object-contain rounded-[6px] dark:invert"
          />
          <span className="text-[14px] font-semibold tracking-tight text-foreground">Dineezy Desk</span>
        </div>
        <SidebarContent
          icons={icons}
          activeWorkspace={activeWorkspace}
          projects={projects}
          projLoading={projLoading}
          projError={projError}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          onNewProject={() => activeWorkspace && setCreateProjectOpen(true)}
          onProjectSettings={(p) => { setActiveProject(p); setProjSettingsOpen(true); }}
        />
      </aside>

      {/* ── Mobile sidebar drawer ───────────────────────────────────────── */}
      <MobileSidebarDrawer isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)}>
        <SidebarContent
          icons={icons}
          activeWorkspace={activeWorkspace}
          projects={projects}
          projLoading={projLoading}
          projError={projError}
          activeProject={activeProject}
          onSelectProject={(p) => { setActiveProject(p); setMobileSidebarOpen(false); }}
          onNewProject={() => { activeWorkspace && setCreateProjectOpen(true); setMobileSidebarOpen(false); }}
          onProjectSettings={(p) => { setActiveProject(p); setProjSettingsOpen(true); setMobileSidebarOpen(false); }}
        />
      </MobileSidebarDrawer>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Topbar */}
        <header className="h-[56px] border-b border-border-custom bg-bg-panel flex items-center justify-between px-[16px] md:px-[24px] shrink-0 z-20 overflow-visible transition-colors duration-100">

          {/* Left: hamburger (mobile) + workspace switcher + breadcrumb */}
          <div className="flex items-center gap-[8px] text-[13px] min-w-0">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-[32px] h-[32px] flex items-center justify-center rounded-[6px] text-text-secondary hover:bg-bg-raised shrink-0 transition-colors duration-75"
              aria-label="Open menu"
            >
              {Icon.menu}
            </button>

            {/* Workspace switcher */}
            <div ref={wsRef} className="relative flex items-center text-[13px]">
              {/* Trigger button */}
              {wsLoading ? (
                <div className="flex items-center gap-[8px] h-[32px] px-[10px] rounded-[6px] animate-pulse">
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-border-custom" />
                  <div className="w-[90px] h-[12px] rounded-[4px] bg-border-custom" />
                </div>
              ) : (
                <button
                  onClick={() => setWsOpen((v) => !v)}
                  className="flex items-center gap-[8px] h-[32px] px-[10px] rounded-[6px] hover:bg-bg-raised text-foreground transition-colors duration-75 select-none"
                >
                  {activeWorkspace ? (
                    <>
                      <span className="text-[16px] leading-none">{activeWorkspace.emoji}</span>
                      <span className="font-semibold text-[13px] max-w-[140px] truncate">{activeWorkspace.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[16px] leading-none">🏢</span>
                      <span className="font-semibold text-[13px] text-text-muted">Select workspace</span>
                    </>
                  )}
                  <span className={`transition-transform duration-100 ${wsOpen ? "rotate-180" : ""}`}>
                    {icons.chevronDown}
                  </span>
                </button>
              )}

              {/* Workspace dropdown */}
              {wsOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[260px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-border-custom rounded-[10px] z-50 overflow-hidden shadow-md animate-slide-down-in">
                  <div className="px-[12px] py-[10px] border-b border-border-custom">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Workspaces</p>
                  </div>

                  {/* Loading */}
                  {wsLoading && [1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-[10px] px-[12px] h-[42px] animate-pulse">
                      <div className="w-[28px] h-[28px] rounded-[6px] bg-border-custom shrink-0" />
                      <div className="flex flex-col gap-[4px] flex-1">
                        <div className="w-[100px] h-[10px] rounded-[3px] bg-border-custom" />
                        <div className="w-[60px] h-[8px] rounded-[3px] bg-border-custom" />
                      </div>
                    </div>
                  ))}

                  {/* Error */}
                  {!wsLoading && wsError && (
                    <div className="px-[12px] py-[14px] flex items-start gap-[8px]">
                      <svg className="shrink-0 mt-[1px] text-[#b91c1c] dark:text-[#F87171]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div className="flex flex-col gap-[6px]">
                        <p className="text-[12px] text-text-secondary">Failed to load workspaces.</p>
                        <button onClick={refetchWorkspaces} className="text-[12px] font-medium underline underline-offset-2 text-left">Try again</button>
                      </div>
                    </div>
                  )}

                  {/* Empty */}
                  {!wsLoading && !wsError && workspaces.length === 0 && (
                    <div className="px-[12px] py-[20px] flex flex-col items-center gap-[10px] text-center">
                      <div className="w-[36px] h-[36px] rounded-[8px] bg-bg-raised flex items-center justify-center text-[18px]">🏢</div>
                      <div>
                        <p className="text-[13px] font-semibold">No workspaces yet</p>
                        <p className="text-[11px] text-text-muted mt-[2px]">Create one to get started</p>
                      </div>
                      <button onClick={() => { setWsOpen(false); setCreateWorkspaceOpen(true); }} className="h-[30px] px-[14px] rounded-[6px] bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-all active:scale-[0.97] cursor-pointer">Create Workspace</button>
                    </div>
                  )}

                  {/* List */}
                  {!wsLoading && !wsError && workspaces.length > 0 && (
                    <div className="py-[6px]">
                      {workspaces.map((ws) => (
                        <div key={ws.id} className={`w-full flex items-center gap-[10px] px-[12px] h-[42px] hover:bg-bg-raised transition-colors duration-100 ${activeWorkspace?.id === ws.id ? "bg-bg-raised text-foreground" : "text-text-secondary"}`}>
                          <button
                            onClick={() => { handleSetActiveWorkspace(ws); setWsOpen(false); }}
                            className="flex items-center gap-[10px] flex-1 min-w-0 h-full text-left"
                          >
                            <span className="w-[28px] h-[28px] rounded-[6px] bg-bg-raised border border-border-custom flex items-center justify-center text-[14px] shrink-0">
                              {ws.emoji}
                            </span>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[13px] font-semibold truncate">{ws.name}</span>
                              <span className="text-[11px] font-medium text-text-muted">{ws.member_count} member{ws.member_count !== 1 ? "s" : ""}</span>
                            </div>
                          </button>
                          {activeWorkspace?.id === ws.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setWsOpen(false); setWsSettingsOpen(true); }}
                              className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-text-muted hover:bg-bg-raised hover:text-foreground transition-all duration-100 shrink-0 active:scale-90"
                              title="Workspace settings"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                            </button>
                          )}
                          {activeWorkspace?.id === ws.id && <span>{icons.check}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create button */}
                  {!wsLoading && workspaces.length > 0 && (
                    <>
                      <div className="border-t border-border-custom" />
                      <div className="py-[6px]">
                        <button
                          onClick={() => { setWsOpen(false); setCreateWorkspaceOpen(true); }}
                          className="w-full flex items-center gap-[10px] px-[12px] h-[38px] text-left hover:bg-bg-raised transition-colors duration-75"
                        >
                          <span className="w-[28px] h-[28px] rounded-[6px] border border-dashed border-border-custom flex items-center justify-center shrink-0">
                            {Icon.plus}
                          </span>
                          <span className="text-[13px] font-semibold text-text-secondary">Create Workspace</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Breadcrumb: shows active project name */}
            {activeProject && (
              <>
                <span className="text-border-custom">/</span>
                <div className="flex items-center gap-[6px] text-text-secondary max-w-[70px] sm:max-w-[200px] truncate">
                  <span className="text-[15px] leading-none shrink-0">{activeProject.emoji}</span>
                  <span className="text-[13px] font-semibold truncate">{activeProject.name}</span>
                </div>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-[8px]">
            <ThemeToggle />

            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-[6px] h-[32px] w-[32px] md:w-auto md:px-[12px] rounded-[6px] text-[#b91c1c] dark:text-[#F87171] text-[13px] font-semibold border border-red-200 dark:border-red-500/20 hover:bg-red-500/5 transition-all duration-75 active:scale-[0.97] cursor-pointer"
              title="Sign out"
            >
              {icons.signout} <span className="hidden md:inline">Sign out</span>
            </button>

          </div>
        </header>

        {/* ── Scrollable content ──────────────────────────────────────────── */}
        {!activeProject ? (
          // No project selected → welcome state
          <div className="flex-1 flex flex-col">
            <WelcomeState />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-[16px] sm:p-[24px] md:p-[32px]">
            {/* Project header */}
            <div className="mb-[32px] flex items-start justify-between gap-[16px]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[12px] mb-[8px] flex-wrap">
                  <span className="text-[28px] leading-none shrink-0">{activeProject.emoji}</span>
                  <h1 className="text-[20px] font-semibold truncate">{activeProject.name}</h1>
                  <span className={`text-[11px] font-semibold px-[8px] py-[3px] rounded-[5px] shrink-0 border ${activeProject.status === "active"
                    ? "bg-[#DCFCE7] dark:bg-[rgba(34,197,94,0.1)] text-[#15803D] dark:text-[#4ADE80] border-green-200/50 dark:border-green-500/15"
                    : activeProject.status === "completed"
                      ? "bg-[#DBEAFE] dark:bg-[rgba(59,130,246,0.1)] text-[#1D4ED8] dark:text-[#60A5FA] border-blue-200/50 dark:border-blue-500/15"
                      : "bg-bg-raised text-text-secondary border-border-custom"
                    }`}>
                    {activeProject.status.charAt(0).toUpperCase() + activeProject.status.slice(1)}
                  </span>
                </div>
                {activeProject.description && (
                  <p className="text-[13px] text-text-secondary max-w-[600px] leading-relaxed">
                    {activeProject.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setProjSettingsOpen(true)}
                className="w-[32px] h-[32px] rounded-[6px] border border-border-custom flex items-center justify-center text-text-secondary hover:bg-bg-raised hover:text-foreground transition-all duration-75 shrink-0 active:scale-95"
                title="Project settings"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>

            {/* Content: loading → empty → loaded */}
            {isContentLoading ? (
              <>
                {/* Stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] md:gap-[16px] mb-[24px] md:mb-[32px]">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-bg-card border border-border-custom rounded-[8px] p-[16px] animate-pulse">
                      <div className="w-[70px] h-[10px] rounded-[3px] bg-border-custom mb-[12px]" />
                      <div className="w-[32px] h-[20px] rounded-[3px] bg-border-custom mb-[8px]" />
                      <div className="w-[80px] h-[9px] rounded-[3px] bg-border-custom" />
                    </div>
                  ))}
                </div>
                <SkeletonModules />
              </>
            ) : collections.length === 0 ? (
              // No modules yet
              <EmptyModulesState onAddModule={() => setAddingModule(true)} />
            ) : (
              <>
                {/* Live stats */}
                <StatsRow stats={stats} collectionCount={collections.length} />

                {/* Modules header */}
                <div className="flex items-center gap-[8px] mb-[16px]">
                  <h2 className="text-[14px] font-semibold">Modules</h2>
                  <span className="bg-bg-raised text-text-secondary text-[11px] px-[6.5px] py-[2px] rounded-[4px] font-semibold border border-border-custom">
                    {collections.length}
                  </span>
                </div>

                {/* Module cards */}
                {collections.map((collection) => (
                  <ModuleCard
                    key={collection.id}
                    collection={collection}
                    tasks={tasks.filter((t) => t.collection_id === collection.id)}
                    expandedTaskId={expandedTaskId}
                    onToggleExpand={handleToggleExpand}
                    onToggleDone={(id) => updateTaskStatus(id, tasks.find((t) => t.id === id)?.status === "done" ? "todo" : "done")}
                    onChangeStatus={(id, s) => updateTaskStatus(id, s)}
                    onSaveDescription={(id, d) => updateTaskDescription(id, d)}
                    onSaveTitle={(id, t) => updateTaskTitle(id, t)}
                    onChangePriority={(id, p) => updateTaskPriority(id, p)}
                    onSaveDueDate={(id, d) => updateTaskDueDate(id, d)}
                    onDeleteTask={(id) => deleteTask(id)}
                    members={members}
                    onAssignUser={(taskId, a) => assignUser(taskId, a)}
                    onUnassignUser={(taskId, uid) => unassignUser(taskId, uid)}
                    addingTaskInModule={addingTaskInModule}
                    onStartAddTask={setAddingTaskInModule}
                    onSubmitTask={handleSubmitTask}
                    onCancelAddTask={() => setAddingTaskInModule(null)}
                    onRenameCollection={(name) => updateCollectionName(collection.id, name)}
                    onDeleteCollection={() => deleteCollection(collection.id)}
                    onAssignCollection={(userId) => assignCollection(collection.id, userId)}
                    onUnassignCollection={(userId) => unassignCollection(collection.id, userId)}
                  />
                ))}
              </>
            )}

            {/* Inline module input */}
            {addingModule && (
              <InlineModuleInput
                onSubmit={handleSubmitModule}
                onCancel={() => setAddingModule(false)}
              />
            )}

            {/* Add module button */}
            {!isContentLoading && collections.length > 0 && !addingModule && (
              <button
                onClick={() => setAddingModule(true)}
                className="flex items-center gap-[8px] h-[36px] px-[12px] rounded-[6px] text-text-muted hover:bg-bg-raised hover:text-foreground transition-all duration-75 text-[13px] active:scale-[0.98] cursor-pointer"
              >
                {Icon.plus} Add module
              </button>
            )}
          </main>
        )}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <RightPanel
        members={members}
        membersLoading={membersLoading}
        progressPercent={stats.progressPercent}
        completedTasks={stats.completed}
        totalTasks={stats.total}
        onInvite={() => setInviteOpen(true)}
        currentUserId={currentUserId}
        onRemoveMember={removeMember}
      />

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onCreated={handleWorkspaceCreated}
      />
      {activeWorkspace && (
        <>
          <CreateProjectModal
            isOpen={createProjectOpen}
            workspaceId={activeWorkspace.id}
            onClose={() => setCreateProjectOpen(false)}
            onCreated={handleProjectCreated}
          />
          <WorkspaceSettingsModal
            isOpen={wsSettingsOpen}
            onClose={() => setWsSettingsOpen(false)}
            workspace={activeWorkspace}
            onUpdate={(fields) => updateWorkspace(activeWorkspace.id, fields)}
            onDelete={() => deleteWorkspace(activeWorkspace.id)}
          />
        </>
      )}
      {activeProject && (
        <ProjectSettingsModal
          isOpen={projSettingsOpen}
          onClose={() => setProjSettingsOpen(false)}
          project={activeProject}
          onUpdate={(fields) => updateProject(activeProject.id, fields)}
          onDelete={async () => { await deleteProject(activeProject.id); setActiveProject(null); }}
        />
      )}
      {activeWorkspace && currentUserId && (
        <InviteMemberModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          workspaceId={activeWorkspace.id}
          requesterId={currentUserId}
          onInvited={refetchMembers}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarContent — shared between desktop aside and mobile drawer
// ─────────────────────────────────────────────────────────────────────────────
interface SidebarContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icons: any;
  activeWorkspace: WorkspaceItem | null;
  projects: ProjectItem[];
  projLoading: boolean;
  projError: string | null;
  activeProject: ProjectItem | null;
  onSelectProject: (p: ProjectItem) => void;
  onNewProject: () => void;
  onProjectSettings: (p: ProjectItem) => void;
}

function SidebarContent({ icons, activeWorkspace, projects, projLoading, projError, activeProject, onSelectProject, onNewProject, onProjectSettings }: SidebarContentProps) {
  return (
    <div className="flex flex-col gap-[24px] px-[12px] py-[8px]">
      {/* Navigation */}
      <div className="flex flex-col">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-[8px] pl-[8px]">Navigation</h3>
        <div className="flex flex-col gap-[2px]">
          <a href="#" className="flex items-center gap-[10px] h-[40px] px-[8px] rounded-[6px] bg-bg-raised text-foreground font-semibold transition-colors duration-100">
            <span>{icons.dashboard}</span>
            <span className="text-[13px]">Dashboard</span>
          </a>
          {(["My tasks", "Analytics", "Team"] as const).map((label, i) => (
            <a key={label} href="#" className="flex items-center gap-[10px] h-[40px] px-[8px] rounded-[6px] text-text-secondary hover:bg-bg-raised hover:text-foreground transition-colors duration-100">
              <span className="opacity-70">{[icons.checkbox, icons.chart, icons.users][i]}</span>
              <span className="text-[13px]">{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-[8px] pl-[8px] pr-[4px]">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Projects</h3>
          {!projLoading && activeWorkspace && (
            <span className="text-[11px] font-semibold text-text-muted bg-bg-raised px-[5px] py-[1px] rounded-[3px] border border-border-custom">{projects.length}</span>
          )}
        </div>
        <div className="flex flex-col gap-[2px]">
          {projLoading && [1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[8px] h-[40px] px-[8px] animate-pulse">
              <div className="w-[14px] h-[14px] rounded-[3px] bg-border-custom shrink-0" />
              <div className="flex-1 h-[10px] rounded-[3px] bg-border-custom" />
            </div>
          ))}
          {!projLoading && projError && <p className="text-[11px] font-medium text-[#b91c1c] dark:text-[#F87171] px-[8px] py-[4px]">Failed to load projects.</p>}
          {!projLoading && !projError && !activeWorkspace && <p className="text-[11px] text-text-muted px-[8px] py-[4px] italic">Select a workspace first.</p>}
          {!projLoading && !projError && activeWorkspace && projects.length === 0 && <p className="text-[11px] text-text-muted px-[8px] py-[4px] italic">No projects yet.</p>}
          {!projLoading && !projError && projects.map((project) => (
            <div
              key={project.id}
              className={`w-full flex items-center gap-[8px] h-[40px] px-[8px] rounded-[6px] transition-colors duration-100 group ${activeProject?.id === project.id
                ? "bg-bg-raised text-foreground font-semibold"
                : "text-text-secondary hover:bg-bg-raised hover:text-foreground"
                }`}
            >
              <button onClick={() => onSelectProject(project)} className="flex items-center gap-[8px] flex-1 min-w-0 h-full text-left">
                <span className="text-[14px] leading-none shrink-0">{project.emoji}</span>
                <span className="text-[13px] truncate flex-1">{project.name}</span>
              </button>
              {project.color && <span className="w-[6px] h-[6px] rounded-full shrink-0 opacity-60 group-hover:opacity-0" style={{ backgroundColor: project.color }} />}
              <button
                onClick={(e) => { e.stopPropagation(); onProjectSettings(project); }}
                className="w-[22px] h-[22px] rounded-[4px] flex items-center justify-center text-text-muted hover:bg-border-custom hover:text-foreground transition-all opacity-0 group-hover:opacity-100 shrink-0 active:scale-90"
                title="Project settings"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
              </button>
            </div>
          ))}
          <button
            onClick={onNewProject}
            disabled={!activeWorkspace}
            className="flex items-center gap-[8px] h-[36px] px-[8px] rounded-[6px] text-text-muted hover:bg-bg-raised hover:text-foreground transition-all duration-75 mt-[2px] disabled:opacity-40 disabled:cursor-not-allowed w-full text-left active:scale-[0.98] cursor-pointer"
          >
            {Icon.plus}
            <span className="text-[13px]">New project</span>
          </button>
        </div>
      </div>
    </div>
  );
}
