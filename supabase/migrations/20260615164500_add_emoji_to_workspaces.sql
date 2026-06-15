-- Add emoji column to workspaces for workspace avatar display
ALTER TABLE "public"."workspaces"
  ADD COLUMN IF NOT EXISTS "emoji" "text" DEFAULT '🏢';
