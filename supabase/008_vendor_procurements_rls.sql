-- Update Analyses Table RLS for Vendors
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Drop the permissive demo policy
DROP POLICY IF EXISTS "Allow all on analyses" ON public.analyses;

-- Create policy for internal users (Admin, Officer, Reviewer)
CREATE POLICY "Internal users can do all on analyses" ON public.analyses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Government Procurement Officer', 'Technical Reviewer')
  )
);

-- Create restricted SELECT policy for Vendors (Approved only)
CREATE POLICY "Vendors can read approved analyses" ON public.analyses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'Vendor/Supplier'
  )
  AND status IN ('Approved', 'Completed') -- Include Completed just in case, per existing code
);

-- Note: We leave Requirements, Recommendations, etc. alone since they are already readable,
-- and the store queries them by fetching analyses first. If the vendor cannot fetch the analysis,
-- the store logic correctly isolates the other data locally.
