
-- 1. Create admin_audit_log table
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view audit logs"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Platform admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add columns to admin_newsletters
ALTER TABLE public.admin_newsletters
  ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- 3. Add suspended_at to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- 4. Fix admin_newsletters RLS - add permissive SELECT for admins
CREATE POLICY "Admins can read newsletters permissive"
  ON public.admin_newsletters FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert newsletters permissive"
  ON public.admin_newsletters FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update newsletters permissive"
  ON public.admin_newsletters FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Platform admin can SELECT all organizations
CREATE POLICY "Platform admins can view all orgs"
  ON public.organizations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Platform admin can view all org_memberships
CREATE POLICY "Platform admins can view all memberships"
  ON public.org_memberships FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Platform admin can view all profiles
CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Auto-create subscription trigger on org creation
CREATE OR REPLACE FUNCTION public.auto_create_subscription()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (org_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', now() + interval '30 days')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_create_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_subscription();

-- 9. Add DELETE policies for resource_chats and direct_messages
CREATE POLICY "Org members can delete chats"
  ON public.resource_chats FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Senders can delete direct messages"
  ON public.direct_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());
