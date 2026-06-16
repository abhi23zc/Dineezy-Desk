-- Allow users to see profiles of people in their shared workspaces
CREATE POLICY "Users can view profiles of workspace members"
  ON "public"."profiles"
  FOR SELECT
  USING (
    id IN (
      SELECT wm.user_id FROM public.workspace_members wm
      WHERE wm.workspace_id IN (
        SELECT wm2.workspace_id FROM public.workspace_members wm2
        WHERE wm2.user_id = auth.uid()
      )
    )
  );
