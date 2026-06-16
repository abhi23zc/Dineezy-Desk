import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { workspace_id, email, role, requester_id } = await request.json();

    if (!workspace_id || !email || !role || !requester_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check requester is owner/admin of the workspace
    const { data: requesterMembership } = await supabaseAdmin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", requester_id)
      .single();

    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
      return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
    }

    // Find user by exact email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    // Check not already a member
    const { data: existing } = await supabaseAdmin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already a member of this workspace" }, { status: 409 });
    }

    // Insert membership
    const { error: insertError } = await supabaseAdmin
      .from("workspace_members")
      .insert({ workspace_id, user_id: profile.id, role });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: { user_id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url, role } });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
