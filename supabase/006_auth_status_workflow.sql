-- Modify existing status column to use new values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('PENDING_APPROVAL', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED'));

-- Migrate existing status text data to new ones
UPDATE public.profiles SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING' AND role = 'Government Procurement Officer';
UPDATE public.profiles SET status = 'PENDING_REVIEW' WHERE status = 'PENDING' AND role = 'Vendor/Supplier';
UPDATE public.profiles SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING';

-- Update the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_status text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Government Procurement Officer');
  
  IF v_role = 'Government Procurement Officer' THEN
    v_status := 'PENDING_APPROVAL';
  ELSIF v_role = 'Vendor/Supplier' THEN
    v_status := 'PENDING_REVIEW';
  ELSIF v_role IN ('Admin', 'Technical Reviewer') THEN
    v_status := 'ACTIVE';
  ELSE
    v_status := 'PENDING_APPROVAL';
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
