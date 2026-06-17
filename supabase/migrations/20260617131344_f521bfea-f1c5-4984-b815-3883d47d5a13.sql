
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

DROP POLICY IF EXISTS "Platform admins can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Platform admins can insert subscriptions"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org members can delete chats" ON public.resource_chats;
CREATE POLICY "Chat authors can delete own chats"
  ON public.resource_chats FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), org_id) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view invitations by token" ON public.invitations;
CREATE POLICY "Invitees can view their own invitation"
  ON public.invitations FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.email()));

DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
CREATE POLICY "Org members can view their documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND (
      EXISTS (
        SELECT 1 FROM public.org_memberships m
        WHERE m.user_id = auth.uid()
          AND m.org_id::text = split_part(name, '/', 1)
      )
      OR split_part(name, '/', 1) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Org authenticated users can upload" ON storage.objects;
CREATE POLICY "Org members can upload to their org or own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND (
      EXISTS (
        SELECT 1 FROM public.org_memberships m
        WHERE m.user_id = auth.uid()
          AND m.org_id::text = split_part(name, '/', 1)
      )
      OR split_part(name, '/', 1) = auth.uid()::text
    )
  );

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_manager_or_admin(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.auto_create_subscription() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_manager_or_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;
