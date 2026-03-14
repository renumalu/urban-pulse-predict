-- Add DELETE policy restricting deletion to profile owner only
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Add explicit DENY policy for anon INSERT on profiles
CREATE POLICY "No anonymous inserts to profiles"
ON public.profiles FOR INSERT
TO anon
WITH CHECK (false);