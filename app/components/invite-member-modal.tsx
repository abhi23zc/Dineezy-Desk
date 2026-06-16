"use client";

import React, { useState } from "react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  requesterId: string;
  onInvited: () => void;
}

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "guest", label: "Guest" },
] as const;

export function InviteMemberModal({ isOpen, onClose, workspaceId, requesterId, onInvited }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleInvite = async () => {
    if (!isValidEmail) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, email: email.trim().toLowerCase(), role, requester_id: requesterId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to invite");
      } else {
        setSuccess(`Invited ${email.trim()} as ${role}`);
        setEmail("");
        onInvited();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={handleClose} />
      <div className="relative w-[400px] max-w-[90vw] bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#E4E4E7] dark:border-[#27272A] rounded-[12px] shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-[24px] flex flex-col gap-[16px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Invite Member</h2>
          <button onClick={handleClose} className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-[4px]">
          <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); setSuccess(null); }}
            placeholder="colleague@example.com"
            className="h-[36px] px-[10px] rounded-[6px] border border-[#E4E4E7] dark:border-[#27272A] bg-transparent text-[13px] outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter" && isValidEmail) handleInvite(); }}
          />
        </div>

        {/* Role */}
        <div className="flex flex-col gap-[6px]">
          <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Role</label>
          <div className="flex items-center gap-[6px]">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`h-[30px] px-[12px] rounded-[6px] text-[12px] font-medium transition-colors ${role === r.value ? "bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B]" : "bg-[#F4F4F5] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#E4E4E7] dark:hover:bg-[#27272A]"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error / Success */}
        {error && <p className="text-[12px] text-[#991B1B] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.08)] rounded-[6px] px-[10px] py-[8px]">{error}</p>}
        {success && <p className="text-[12px] text-[#065F46] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[rgba(16,185,129,0.08)] rounded-[6px] px-[10px] py-[8px]">{success}</p>}

        {/* Submit */}
        <button
          onClick={handleInvite}
          disabled={!isValidEmail || loading}
          className="h-[36px] rounded-[8px] bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Inviting..." : "Send invite"}
        </button>

        <p className="text-[11px] text-[#A1A1AA] leading-relaxed">The user must already have an account. Enter their full email address to find them.</p>
      </div>
    </div>
  );
}
