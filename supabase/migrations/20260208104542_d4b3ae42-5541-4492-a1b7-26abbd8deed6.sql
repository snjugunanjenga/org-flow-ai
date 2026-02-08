
-- Direct messages for in-platform communication
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  sender_id UUID NOT NULL,
  recipient_id UUID,
  team_id UUID REFERENCES public.teams(id),
  content TEXT NOT NULL,
  is_team_message BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view direct messages" ON public.direct_messages
  FOR SELECT USING (
    is_org_member(auth.uid(), org_id) AND (
      sender_id = auth.uid() OR recipient_id = auth.uid() OR
      (is_team_message = true AND EXISTS (
        SELECT 1 FROM public.team_memberships WHERE team_id = direct_messages.team_id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Org members can send direct messages" ON public.direct_messages
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id) AND sender_id = auth.uid());

CREATE POLICY "Users can update own messages" ON public.direct_messages
  FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Calendar events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meet_link TEXT,
  event_type TEXT DEFAULT 'meeting',
  created_by UUID NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view events" ON public.calendar_events
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can create events" ON public.calendar_events
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id) AND created_by = auth.uid());

CREATE POLICY "Creators can update events" ON public.calendar_events
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Creators can delete events" ON public.calendar_events
  FOR DELETE USING (created_by = auth.uid());

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Document attachments (references storage URLs)
CREATE TABLE public.document_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  resource_type TEXT NOT NULL, -- 'project', 'topic', 'decision', 'meeting'
  resource_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view attachments" ON public.document_attachments
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can upload attachments" ON public.document_attachments
  FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id) AND uploaded_by = auth.uid());

CREATE POLICY "Uploaders can delete attachments" ON public.document_attachments
  FOR DELETE USING (uploaded_by = auth.uid());

-- Storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Org authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Uploaders can delete documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow delete on project_tasks for cleanup
CREATE POLICY "Org members can delete tasks" ON public.project_tasks
  FOR DELETE USING (is_org_member(auth.uid(), org_id));

-- Allow delete on projects for managers
CREATE POLICY "Managers can delete projects" ON public.projects
  FOR DELETE USING (is_org_manager_or_admin(auth.uid(), org_id));
