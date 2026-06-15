CREATE TABLE IF NOT EXISTS public.connector_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connector text NOT NULL,
  external_id text,
  label text,
  cursor text,
  last_synced_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, connector, external_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connector_subscriptions TO authenticated;
GRANT ALL ON public.connector_subscriptions TO service_role;

ALTER TABLE public.connector_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read connector subs" ON public.connector_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "managers manage connector subs" ON public.connector_subscriptions
  FOR ALL TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), org_id))
  WITH CHECK (public.is_org_manager_or_admin(auth.uid(), org_id));

CREATE TRIGGER set_connector_subs_updated_at
  BEFORE UPDATE ON public.connector_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Idempotency for agent-ingest: hash of (org_id, source_hash) prevents duplicate processing
CREATE TABLE IF NOT EXISTS public.ingest_dedupe (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_hash text NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, source_hash)
);

GRANT SELECT, INSERT ON public.ingest_dedupe TO authenticated;
GRANT ALL ON public.ingest_dedupe TO service_role;

ALTER TABLE public.ingest_dedupe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read ingest dedupe" ON public.ingest_dedupe
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "service role inserts ingest dedupe" ON public.ingest_dedupe
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));