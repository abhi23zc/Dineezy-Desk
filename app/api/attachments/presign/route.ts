/**
 * POST /api/attachments/presign
 * Generates presigned URLs for R2 storage operations
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

// Supabase admin client for verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Type definitions
interface PresignRequestBody {
  filePath: string;
  mimeType: string;
  operation: "upload" | "download";
  fileName?: string;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  url: string;
  expiresIn: number;
}

/**
 * Verify user has access to the task's workspace
 */
async function verifyTaskAccess(
  taskId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get the collection and project for this task
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

    // Check if user is a member of the workspace
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

/**
 * POST handler for generating presigned URLs
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body: PresignRequestBody = await request.json();
    const { filePath, mimeType, operation, fileName } = body;

    // Validate required fields
    if (!filePath || !operation) {
      return NextResponse.json(
        { error: "Missing required fields: filePath, operation" },
        { status: 400 }
      );
    }

    if (operation === "upload" && !mimeType) {
      return NextResponse.json(
        { error: "Missing required field for upload: mimeType" },
        { status: 400 }
      );
    }

    // Verify user authentication
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

    // Extract taskId from filePath (format: tasks/{taskId}/{timestamp}-{filename})
    const pathParts = filePath.split("/");
    if (pathParts.length < 3 || pathParts[0] !== "tasks") {
      return NextResponse.json(
        { error: "Invalid file path format" },
        { status: 400 }
      );
    }
    const taskId = pathParts[1];

    // Verify user has access to this task
    const hasAccess = await verifyTaskAccess(taskId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this task" },
        { status: 403 }
      );
    }

    // Generate presigned URL based on operation
    let command;
    let expiresIn = 3600; // Default 1 hour for downloads

    if (operation === "upload") {
      command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        ContentType: mimeType,
      });
      expiresIn = 300; // 5 minutes for uploads (enough for most files)
    } else if (operation === "download") {
      command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        ...(fileName && {
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
        }),
      });
    } else {
      return NextResponse.json(
        { error: "Invalid operation. Must be 'upload' or 'download'" },
        { status: 400 }
      );
    }

    const url = await getSignedUrl(r2Client, command, { expiresIn });

    return NextResponse.json({
      url,
      expiresIn,
    });

  } catch (error) {
    console.error("Error in presign handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
