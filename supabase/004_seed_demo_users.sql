DO $$ 
DECLARE
    admin_id uuid;
    reviewer_id uuid;
    officer_id uuid;
    vendor_id uuid;
BEGIN
    -- 1. Create Admin User
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@manakx.demo';
    IF admin_id IS NULL THEN
      admin_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (admin_id, 'authenticated', 'authenticated', 'admin@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"System Admin","role":"Admin","organization":"MANAKX"}', now(), now());
    END IF;

    -- 2. Create Reviewer User
    SELECT id INTO reviewer_id FROM auth.users WHERE email = 'reviewer@manakx.demo';
    IF reviewer_id IS NULL THEN
      reviewer_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (reviewer_id, 'authenticated', 'authenticated', 'reviewer@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"S. Nair","role":"Technical Reviewer","department":"Technical Evaluation"}', now(), now());
    END IF;

    -- 3. Create Officer User
    SELECT id INTO officer_id FROM auth.users WHERE email = 'officer@manakx.demo';
    IF officer_id IS NULL THEN
      officer_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (officer_id, 'authenticated', 'authenticated', 'officer@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"A. Sharma","role":"Government Procurement Officer","organization":"Ministry of Defence","department":"Procurement","employee_id":"MOD-1049"}', now(), now());
    END IF;

    -- 4. Create Vendor User
    SELECT id INTO vendor_id FROM auth.users WHERE email = 'vendor@manakx.demo';
    IF vendor_id IS NULL THEN
      vendor_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (vendor_id, 'authenticated', 'authenticated', 'vendor@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Rahul Vendor","role":"Vendor/Supplier","company_name":"ABC Electronics","industry":"IT Hardware","phone":"9876543210"}', now(), now());
    END IF;

    -- Force Profiles creation (in case the trigger failed or the user existed without a profile)
    INSERT INTO public.profiles (id, email, name, role, status, organization)
    VALUES (admin_id, 'admin@manakx.demo', 'System Admin', 'Admin', 'ACTIVE', 'MANAKX')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, name, role, status, department)
    VALUES (reviewer_id, 'reviewer@manakx.demo', 'S. Nair', 'Technical Reviewer', 'ACTIVE', 'Technical Evaluation')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, name, role, status, organization, department, employee_id)
    VALUES (officer_id, 'officer@manakx.demo', 'A. Sharma', 'Government Procurement Officer', 'ACTIVE', 'Ministry of Defence', 'Procurement', 'MOD-1049')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, name, role, status, company_name, industry, phone)
    VALUES (vendor_id, 'vendor@manakx.demo', 'Rahul Vendor', 'Vendor/Supplier', 'ACTIVE', 'ABC Electronics', 'IT Hardware', '9876543210')
    ON CONFLICT (id) DO NOTHING;

END $$;

-- 5. Force ALL demo users to be ACTIVE (just in case they were already there but pending)
UPDATE public.profiles
SET status = 'ACTIVE'
WHERE email IN ('admin@manakx.demo', 'reviewer@manakx.demo', 'officer@manakx.demo', 'vendor@manakx.demo');
