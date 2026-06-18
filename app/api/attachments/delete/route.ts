/**
 * POST /api/attachments/delete
 * Deletes a file from R2 storage
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// R2 Configuration
const R2_ACCOUNT_ID = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "dineezy-attachments";

// Initialize S3-compatible R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DeleteRequestBody {
  filePath: string;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: boolean;
}

async function verifyTaskAccess(taskId: string, userId: string): Promise<boolean> {
  try {
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select("collection_id")
      .eq("id", taskId)
      .single();

    if (taskError || !taskData) return false;

    const { data: collectionData, error: collectionError } = await supabaseAdmin
      .from("collections")
      .select("project_id")
      .eq("id", taskData.collection_id)
      .single();

    if (collectionError || !collectionData) return false;

    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("workspace_id")
      .eq("id", collectionData.project_id)
      .single();

    if (projectError || !projectData) return false;

    const { data: membership } = await supabaseAdmin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", projectData.workspace_id)
      .eq("user_id", userId)
      .single();

    return !!membership;
  } catch (error) {
    console.error("Error verifying task access:", error);
    return false;
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const body: DeleteRequestBody = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing required field: filePath" },
        { status: 400 }
      );
    }

    // Validate file path format
    if (!filePath.startsWith("tasks/") || filePath.includes("..") || filePath.includes("//")) {
      return NextResponse.json(
        { error: "Invalid file path format" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const pathParts = filePath.split("/");
    if (pathParts.length < 3 || pathParts[0] !== "tasks") {
      return NextResponse.json(
        { error: "Invalid file path format" },
        { status: 400 }
      );
    }

    const hasAccess = await verifyTaskAccess(pathParts[1], user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this task" },
        { status: 403 }
      );
    }

    // Delete object from R2
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting file from R2:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
