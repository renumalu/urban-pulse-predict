-- Allow authenticated users to read other profiles' display names for reports
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);