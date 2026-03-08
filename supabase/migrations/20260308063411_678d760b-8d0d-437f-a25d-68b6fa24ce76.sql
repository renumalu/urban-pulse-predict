
-- 1. Restrict emergency_units to authenticated users only
DROP POLICY IF EXISTS "Emergency units are publicly readable" ON public.emergency_units;
CREATE POLICY "Emergency units readable by authenticated users"
  ON public.emergency_units FOR SELECT TO authenticated
  USING (true);

-- 2. Restrict profiles: users can only view their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 3. Allow users to delete their own citizen reports
CREATE POLICY "Users can delete own reports"
  ON public.citizen_reports FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 4. Restrict citizen_reports UPDATE to prevent vote_count manipulation
-- Drop existing update policy and replace with one that prevents vote_count changes
DROP POLICY IF EXISTS "Users can update own reports" ON public.citizen_reports;
CREATE POLICY "Users can update own reports"
  ON public.citizen_reports FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND vote_count = (SELECT vote_count FROM public.citizen_reports WHERE id = citizen_reports.id));
