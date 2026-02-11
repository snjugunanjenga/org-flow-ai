
-- Fix: Allow org creators to SELECT their own orgs (needed for INSERT...RETURNING)
CREATE POLICY "Creators can view own orgs"
ON public.organizations
FOR SELECT
USING (auth.uid() = created_by);
