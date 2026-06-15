
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;

CREATE POLICY "Managers can update milestones"
  ON public.project_milestones
  FOR UPDATE
  USING (is_org_manager_or_admin(auth.uid(), org_id))
  WITH CHECK (is_org_manager_or_admin(auth.uid(), org_id));

CREATE POLICY "Managers can delete milestones"
  ON public.project_milestones
  FOR DELETE
  USING (is_org_manager_or_admin(auth.uid(), org_id));
