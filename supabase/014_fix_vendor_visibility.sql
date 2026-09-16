-- 014_fix_vendor_visibility.sql
-- Fix: Allow vendors to READ their own evaluation results
-- Fix: Clean up stuck PROCESSING assessments

-- 1. Add a SELECT-only RLS policy so vendors can see their own evaluations
DROP POLICY IF EXISTS "Vendors can read own evaluations" ON public.vendor_evaluations;
CREATE POLICY "Vendors can read own evaluations"
  ON public.vendor_evaluations
  FOR SELECT
  USING (vendor_id = auth.uid());

-- 2. Clean up any stuck PROCESSING assessments from earlier failed runs
UPDATE public.assessments 
  SET status = 'FAILED' 
  WHERE status = 'PROCESSING' 
    AND created_at < NOW() - INTERVAL '1 hour';

NOTIFY pgrst, 'reload schema';
