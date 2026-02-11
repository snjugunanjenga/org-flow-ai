
-- Resource notebooks
CREATE TABLE public.resource_notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resource_notebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view notebooks" ON public.resource_notebooks FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can create notebooks" ON public.resource_notebooks FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id) AND created_by = auth.uid());
CREATE POLICY "Creators can update notebooks" ON public.resource_notebooks FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Creators can delete notebooks" ON public.resource_notebooks FOR DELETE USING (created_by = auth.uid());
CREATE TRIGGER update_resource_notebooks_updated_at BEFORE UPDATE ON public.resource_notebooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Resource sources
CREATE TABLE public.resource_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.resource_notebooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  source_type TEXT NOT NULL DEFAULT 'text',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resource_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view sources" ON public.resource_sources FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can create sources" ON public.resource_sources FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can delete sources" ON public.resource_sources FOR DELETE USING (is_org_member(auth.uid(), org_id));

-- Resource chats
CREATE TABLE public.resource_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.resource_notebooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resource_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view chats" ON public.resource_chats FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can create chats" ON public.resource_chats FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id) AND user_id = auth.uid());

-- Resource outputs
CREATE TABLE public.resource_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.resource_notebooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  output_type TEXT NOT NULL DEFAULT 'guide',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.resource_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view outputs" ON public.resource_outputs FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can create outputs" ON public.resource_outputs FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
