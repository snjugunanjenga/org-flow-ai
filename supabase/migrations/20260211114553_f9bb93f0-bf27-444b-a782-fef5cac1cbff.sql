
-- Allow users to insert their own role
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());
