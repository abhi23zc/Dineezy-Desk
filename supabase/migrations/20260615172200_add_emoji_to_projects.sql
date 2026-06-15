-- Add emoji column to projects table for project avatar display
ALTER TABLE "public"."projects"
  ADD COLUMN IF NOT EXISTS "emoji" "text" DEFAULT '📁';
