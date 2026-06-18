/**
 * Cloudflare R2 Storage Service
 * Handles file uploads, downloads, and presigned URL generation
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 Client Configuration
const R2_ACCOUNT_ID = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "dineezy-attachments";
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

// Initialize S3-compatible R2 client
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// Attachment configuration
export const ATTACHMENT_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    // Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    // Documents
    "application/pdf", "text/plain", "text/markdown",
    // Office
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
    // Code
    "application/json", "text/javascript", "text/css", "text/html",
    // Archives
    "application/zip", "application/x-7z-compressed",
  ],
  allowedExtensions: [
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".pdf", ".txt", ".md",
    ".docx", ".xlsx", ".pptx",
    ".json", ".js", ".ts", ".css", ".html", ".jsx", ".tsx",
    ".zip", ".7z"
  ],
};

/**
 * Generate a unique file path for storage
 */
export function generateFilePath(taskId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `tasks/${taskId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Get public URL for a file (if using public bucket)
 */
export function getPublicFileUrl(filePath: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${filePath}`;
  }
  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filePath}`;
}

/**
 * Generate presigned upload URL (server-side only)
 */
export async function generateUploadUrl(
  filePath: string,
  mimeType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filePath,
    ContentType: mimeType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate presigned download URL
 */
export async function generateDownloadUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filePath,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: filePath,
  });

  await r2Client.send(command);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "powerpoint";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType.includes("json") || mimeType.includes("javascript")) return "code";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "archive";
  return "file";
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > ATTACHMENT_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(ATTACHMENT_CONFIG.maxFileSize)} limit`,
    };
  }

  // Check mime type
  if (!ATTACHMENT_CONFIG.allowedMimeTypes.includes(file.type)) {
    // Check extension as fallback
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ATTACHMENT_CONFIG.allowedExtensions.includes(extension || "")) {
      return {
        valid: false,
        error: "File type not allowed. Allowed: images, PDFs, documents, code files, archives",
      };
    }
  }

  return { valid: true };
}
