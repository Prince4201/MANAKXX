-- ManakX Role Management Update
-- Run this in Supabase SQL Editor

-- 1. Update profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS approved,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS phone text;

-- 2. Update trigger to handle the new fields and logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_status text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Government Procurement Officer');
  
  -- Officer starts PENDING, others start ACTIVE 
  -- (Reviewer and Admin are created by Admins, Vendor is self-reg active)
  IF v_role = 'Government Procurement Officer' THEN
    v_status := 'PENDING';
  ELSE
    v_status := 'ACTIVE';
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- who performed the action
  action text NOT NULL,
  role text, -- role of the user who performed the action
  entity text, -- what was acted upon (e.g., 'User Approval', 'Registration')
  details jsonb, -- extra context
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read all audit logs" ON public.audit_logs FOR SELECT USING (
  public.is_admin()
);

DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
