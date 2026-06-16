"use client";

import React, { useState } from "react";
import { superbase } from "../../utils/supabase_client";

const EMOJI_WS = ["🏢", "🚀", "⚡", "🎯", "💡", "🔥", "🌟", "🎨", "🛠️", "📊", "🧩", "🌍", "🏆", "💼"];
const EMOJI_PROJ = ["📁", "🎯", "🚀", "💡", "🔥", "🎨", "📊", "🧩", "🏆", "💎", "🌈", "⚡", "🛠️", "📱"];
const COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"];

interface OnboardingProps {
  userId: string;
  userName: string | null;
  onComplete: (workspaceId: string, projectId: string | null) => void;
}

export function Onboarding({ userId, userName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [wsName, setWsName] = useState("");
  const [wsEmoji, setWsEmoji] = useState("🏢");

  // Step 2
  const [projName, setProjName] = useState("");
  const [projEmoji, setProjEmoji] = useState("📁");
  const [projColor, setProjColor] = useState(COLORS[5]);

  // Step 3
  const [colName, setColName] = useState("");

  // IDs from creation
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const toSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await superbase
        .from("workspaces")
        .insert({ name: wsName.trim(), slug: toSlug(wsName), emoji: wsEmoji, created_by: userId })
        .select("id")
        .single();
      if (e) throw new Error(e.message);
      await superbase.from("workspace_members").insert({ workspace_id: data.id, user_id: userId, role: "owner" });
      setWorkspaceId(data.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projName.trim() || !workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await superbase
        .from("projects")
        .insert({ workspace_id: workspaceId, name: projName.trim(), emoji: projEmoji, color: projColor, status: "active", created_by: userId })
        .select("id")
        .single();
      if (e) throw new Error(e.message);
      setProjectId(data.id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!colName.trim() || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { error: e } = await superbase
        .from("collections")
        .insert({ project_id: projectId, name: colName.trim(), position: 0, created_by: userId });
      if (e) throw new Error(e.message);
      onComplete(workspaceId!, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#000000] font-sans text-[#09090B] dark:text-[#FAFAFA] p-[24px]">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Progress */}
        <div className="flex items-center gap-[8px] mb-[40px]">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-[3px] w-[40px] rounded-full transition-colors ${s <= step ? "bg-[#09090B] dark:bg-[#FAFAFA]" : "bg-[#E4E4E7] dark:bg-[#27272A]"}`} />
          ))}
        </div>

        {/* Step 1: Workspace */}
        {step === 1 && (
          <div className="w-full flex flex-col items-center">
            <h1 className="text-[22px] font-semibold mb-[6px]">Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!</h1>
            <p className="text-[14px] text-[#52525B] dark:text-[#A1A1AA] mb-[32px]">Let&apos;s create your first workspace.</p>

            <div className="w-full flex flex-col gap-[16px]">
              <div className="flex items-center gap-[10px]">
                <div className="relative">
                  <button
                    onClick={() => setWsEmoji(EMOJI_WS[(EMOJI_WS.indexOf(wsEmoji) + 1) % EMOJI_WS.length])}
                    className="w-[44px] h-[44px] rounded-[10px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#0A0A0A] flex items-center justify-center text-[22px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors"
                    title="Click to change emoji"
                  >
                    {wsEmoji}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Workspace name"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateWorkspace(); }}
                  autoFocus
                  maxLength={80}
                  className="flex-1 h-[44px] px-[14px] rounded-[10px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[14px] outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors"
                />
              </div>

              {error && <p className="text-[12px] text-[#991B1B] dark:text-[#F87171]">{error}</p>}

              <button
                onClick={handleCreateWorkspace}
                disabled={!wsName.trim() || loading}
                className="w-full h-[40px] rounded-[10px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create workspace"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Project */}
        {step === 2 && (
          <div className="w-full flex flex-col items-center">
            <h1 className="text-[22px] font-semibold mb-[6px]">Create a project</h1>
            <p className="text-[14px] text-[#52525B] dark:text-[#A1A1AA] mb-[32px]">Projects organize your work within the workspace.</p>

            <div className="w-full flex flex-col gap-[16px]">
              <div className="flex items-center gap-[10px]">
                <button
                  onClick={() => setProjEmoji(EMOJI_PROJ[(EMOJI_PROJ.indexOf(projEmoji) + 1) % EMOJI_PROJ.length])}
                  className="w-[44px] h-[44px] rounded-[10px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#0A0A0A] flex items-center justify-center text-[22px] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors"
                  title="Click to change emoji"
                >
                  {projEmoji}
                </button>
                <input
                  type="text"
                  placeholder="Project name"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateProject(); }}
                  autoFocus
                  maxLength={80}
                  className="flex-1 h-[44px] px-[14px] rounded-[10px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[14px] outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors"
                />
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-[8px]">
                <span className="text-[12px] text-[#A1A1AA]">Color:</span>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setProjColor(c)}
                    className={`w-[20px] h-[20px] rounded-full transition-all ${projColor === c ? "ring-2 ring-offset-2 ring-[#09090B] dark:ring-[#FAFAFA] dark:ring-offset-[#000000]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {error && <p className="text-[12px] text-[#991B1B] dark:text-[#F87171]">{error}</p>}

              <button
                onClick={handleCreateProject}
                disabled={!projName.trim() || loading}
                className="w-full h-[40px] rounded-[10px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create project"}
              </button>

              <button
                onClick={() => onComplete(workspaceId!, null)}
                className="text-[13px] text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Collection */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center">
            <h1 className="text-[22px] font-semibold mb-[6px]">Create a module</h1>
            <p className="text-[14px] text-[#52525B] dark:text-[#A1A1AA] mb-[32px]">Modules group related tasks within a project.</p>

            <div className="w-full flex flex-col gap-[16px]">
              <input
                type="text"
                placeholder="e.g. Sprint 1, Design, Backend"
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateCollection(); }}
                autoFocus
                maxLength={80}
                className="w-full h-[44px] px-[14px] rounded-[10px] border border-[#E4E4E7] dark:border-[#27272A] bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[14px] outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors"
              />

              {error && <p className="text-[12px] text-[#991B1B] dark:text-[#F87171]">{error}</p>}

              <button
                onClick={handleCreateCollection}
                disabled={!colName.trim() || loading}
                className="w-full h-[40px] rounded-[10px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create module"}
              </button>

              <button
                onClick={() => onComplete(workspaceId!, projectId)}
                className="text-[13px] text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
