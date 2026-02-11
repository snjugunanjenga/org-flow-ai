
-- Subscriptions table for organization billing
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'canceled', 'past_due')),
  trial_ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  current_period_start timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own subscription"
ON public.subscriptions FOR SELECT
USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Platform admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR is_org_member(auth.uid(), org_id));

-- Admin newsletters / communications table
CREATE TABLE public.admin_newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  sent_by uuid NOT NULL,
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'pro', 'enterprise', 'free')),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage newsletters"
ON public.admin_newsletters FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policy for resource_outputs DELETE (was missing)
CREATE POLICY "Org members can delete outputs"
ON public.resource_outputs FOR DELETE
USING (is_org_member(auth.uid(), org_id));

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
