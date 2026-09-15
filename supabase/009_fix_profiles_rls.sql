-- Fix infinite recursion caused by querying public.profiles inside its own RLS policy

-- 1. Create a SECURITY DEFINER function to safely check if the user is a Technical Reviewer
CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Technical Reviewer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the Reviewer SELECT policy to use the safe function
DROP POLICY IF EXISTS "Reviewer can read pending vendor profiles" ON public.profiles;
CREATE POLICY "Reviewer can read pending vendor profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_reviewer()
    AND role = 'Vendor/Supplier'
  );

-- 3. Update the Reviewer UPDATE policy to use the safe function
DROP POLICY IF EXISTS "Reviewer can update pending vendor profiles" ON public.profiles;
CREATE POLICY "Reviewer can update pending vendor profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.is_reviewer()
    AND role = 'Vendor/Supplier'
    AND status IN ('PENDING_REVIEW', 'ACTIVE', 'REJECTED')
  );
