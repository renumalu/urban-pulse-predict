
-- Fix broken self-referential subquery in citizen_reports UPDATE policy
DROP POLICY IF EXISTS "Users can update own reports" ON public.citizen_reports;

CREATE POLICY "Users can update own reports"
ON public.citizen_reports
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND vote_count = (
    SELECT cr.vote_count 
    FROM public.citizen_reports cr 
    WHERE cr.id = citizen_reports.id
  )
);
