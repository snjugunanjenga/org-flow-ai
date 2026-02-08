
-- Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE UNIQUE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_org_id ON public.invitations(org_id);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Org managers/admins can create invitations
CREATE POLICY "Managers can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (is_org_manager_or_admin(auth.uid(), org_id));

-- Org managers/admins can view invitations for their org
CREATE POLICY "Managers can view org invitations"
ON public.invitations FOR SELECT
USING (is_org_manager_or_admin(auth.uid(), org_id));

-- Anyone authenticated can look up invitations by token (for accept flow)
CREATE POLICY "Users can view invitations by token"
ON public.invitations FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Managers can update invitation status
CREATE POLICY "Managers can update invitations"
ON public.invitations FOR UPDATE
USING (is_org_manager_or_admin(auth.uid(), org_id));

-- Create a function to accept invitations (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO _invitation FROM public.invitations WHERE token = _token AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invitation');
  END IF;

  IF _invitation.expires_at < now() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = _invitation.id;
    RETURN jsonb_build_object('error', 'Invitation has expired');
  END IF;

  -- Add user to org
  INSERT INTO public.org_memberships (org_id, user_id, role)
  VALUES (_invitation.org_id, _user_id, _invitation.role)
  ON CONFLICT DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.invitations SET status = 'accepted' WHERE id = _invitation.id;

  -- Mark onboarding as completed
  UPDATE public.profiles SET onboarding_completed = true WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true, 'org_id', _invitation.org_id);
END;
$$;
