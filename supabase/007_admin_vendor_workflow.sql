-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admin can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

DROP POLICY IF EXISTS "Admin can read audit logs" ON public.audit_logs;
CREATE POLICY "Admin can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- Also allow service role for edge functions
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Add missing profile columns for review and approval tracking
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Update trigger to respect force_active flag
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_status text;
  v_force_active boolean;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Government Procurement Officer');
  v_force_active := COALESCE((NEW.raw_user_meta_data->>'force_active')::boolean, false);
  
  IF v_force_active THEN
    v_status := 'ACTIVE';
  ELSE
    IF v_role = 'Government Procurement Officer' THEN
      v_status := 'PENDING_APPROVAL';
    ELSIF v_role = 'Vendor/Supplier' THEN
      v_status := 'PENDING_REVIEW';
    ELSIF v_role IN ('Admin', 'Technical Reviewer') THEN
      v_status := 'ACTIVE';
    ELSE
      v_status := 'PENDING_APPROVAL';
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id, email, name, role, status, 
    organization, department, employee_id, 
    company_name, industry, phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    v_status,
    NEW.raw_user_meta_data->>'organization',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'employee_id',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'industry',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    role = EXCLUDED.role;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for Technical Reviewer to read and update Pending Vendors
DROP POLICY IF EXISTS "Reviewer can read pending vendor profiles" ON public.profiles;
CREATE POLICY "Reviewer can read pending vendor profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Technical Reviewer')
    AND role = 'Vendor/Supplier'
  );

DROP POLICY IF EXISTS "Reviewer can update pending vendor profiles" ON public.profiles;
CREATE POLICY "Reviewer can update pending vendor profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Technical Reviewer')
    AND role = 'Vendor/Supplier'
    AND status IN ('PENDING_REVIEW', 'ACTIVE', 'REJECTED')
  );
