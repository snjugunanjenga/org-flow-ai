
-- Phase 3 & 4: Auth, Multi-Tenant, RBAC, Teams

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'member');

-- 2. Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Org memberships
CREATE TABLE public.org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

-- 4. User roles (separate table for RBAC, avoids recursion)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  department TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 7. Team memberships
CREATE TABLE public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id)
);
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- 8. Security definer functions

-- Check if user belongs to an org
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = _user_id AND org_id = _org_id
  )
$$;

-- Check role within an org
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = _user_id AND org_id = _org_id AND role = _role
  )
$$;

-- Check if user is manager or admin in an org
CREATE OR REPLACE FUNCTION public.is_org_manager_or_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = _user_id AND org_id = _org_id AND role IN ('manager', 'admin')
  )
$$;

-- has_role for global roles (user_roles table)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 9. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. RLS Policies

-- Organizations: members can view their orgs
CREATE POLICY "Users can view their orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create orgs" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_org_role(auth.uid(), id, 'admin'));

-- Org memberships: members can view memberships in their org
CREATE POLICY "Members can view org memberships" ON public.org_memberships
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Admins can manage org memberships" ON public.org_memberships
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_manager_or_admin(auth.uid(), org_id));

CREATE POLICY "Admins can update org memberships" ON public.org_memberships
  FOR UPDATE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), org_id));

CREATE POLICY "Admins can delete org memberships" ON public.org_memberships
  FOR DELETE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), org_id));

-- User roles: users can see their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Profiles: viewable by org members (via join), own profile editable
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view org member profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om1
      JOIN public.org_memberships om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.user_id
    )
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Teams: org members can view, managers can manage
CREATE POLICY "Org members can view teams" ON public.teams
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Managers can create teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_manager_or_admin(auth.uid(), org_id));

CREATE POLICY "Managers can update teams" ON public.teams
  FOR UPDATE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), org_id));

CREATE POLICY "Managers can delete teams" ON public.teams
  FOR DELETE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), org_id));

-- Team memberships: org members can view, managers can manage
CREATE POLICY "Org members can view team memberships" ON public.team_memberships
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Managers can assign team members" ON public.team_memberships
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_manager_or_admin(auth.uid(), org_id));

CREATE POLICY "Managers can remove team members" ON public.team_memberships
  FOR DELETE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), org_id));

-- Allow org creator to also insert themselves as admin member
CREATE POLICY "Creator can add self as member" ON public.org_memberships
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
