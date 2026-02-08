
-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  source_type TEXT NOT NULL DEFAULT 'slack',
  sender_user_id UUID REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  recipients TEXT[] DEFAULT '{}',
  subject TEXT,
  content TEXT NOT NULL,
  channel TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view messages" ON public.messages FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert messages" ON public.messages FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Meeting transcripts
CREATE TABLE public.meeting_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  participants TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  duration_minutes INT,
  channel TEXT DEFAULT 'zoom',
  meeting_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view transcripts" ON public.meeting_transcripts FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert transcripts" ON public.meeting_transcripts FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Meeting summaries
CREATE TABLE public.meeting_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  transcript_id UUID REFERENCES public.meeting_transcripts(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_decisions TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]',
  sentiment TEXT DEFAULT 'neutral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view summaries" ON public.meeting_summaries FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert summaries" ON public.meeting_summaries FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Topics / Decisions
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'decision',
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  source_type TEXT,
  source_id UUID,
  owner_name TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view topics" ON public.topics FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert topics" ON public.topics FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can update topics" ON public.topics FOR UPDATE USING (is_org_member(auth.uid(), org_id));

-- Conflicts
CREATE TABLE public.conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  topic_ids UUID[] DEFAULT '{}',
  parties TEXT[] DEFAULT '{}',
  resolution TEXT,
  detected_by TEXT DEFAULT 'critic_agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view conflicts" ON public.conflicts FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert conflicts" ON public.conflicts FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can update conflicts" ON public.conflicts FOR UPDATE USING (is_org_member(auth.uid(), org_id));

-- Projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  progress INT DEFAULT 0,
  owner_name TEXT,
  team_name TEXT,
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view projects" ON public.projects FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Managers can insert projects" ON public.projects FOR INSERT WITH CHECK (is_org_manager_or_admin(auth.uid(), org_id));
CREATE POLICY "Managers can update projects" ON public.projects FOR UPDATE USING (is_org_manager_or_admin(auth.uid(), org_id));

-- Project milestones
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  target_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view milestones" ON public.project_milestones FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Managers can insert milestones" ON public.project_milestones FOR INSERT WITH CHECK (is_org_manager_or_admin(auth.uid(), org_id));

-- Project tasks
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  assignee_name TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view tasks" ON public.project_tasks FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert tasks" ON public.project_tasks FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can update tasks" ON public.project_tasks FOR UPDATE USING (is_org_member(auth.uid(), org_id));

-- Project updates (agent-generated)
CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  content TEXT NOT NULL,
  generated_by TEXT DEFAULT 'coordinator_agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view updates" ON public.project_updates FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert updates" ON public.project_updates FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  reasoning TEXT,
  source_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Agent logs
CREATE TABLE public.agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  reasoning TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view agent logs" ON public.agent_logs FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert agent logs" ON public.agent_logs FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Knowledge graph edges
CREATE TABLE public.graph_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  source_type TEXT NOT NULL,
  source_label TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_label TEXT NOT NULL,
  relationship TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view edges" ON public.graph_edges FOR SELECT USING (is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can insert edges" ON public.graph_edges FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Communication logs (aggregated)
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  team_name TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'weekly',
  messages_count INT DEFAULT 0,
  avg_response_time_mins FLOAT,
  sentiment_score FLOAT,
  collaboration_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view comm logs" ON public.communication_logs FOR SELECT USING (is_org_manager_or_admin(auth.uid(), org_id));
CREATE POLICY "Service can insert comm logs" ON public.communication_logs FOR INSERT WITH CHECK (is_org_member(auth.uid(), org_id));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;
