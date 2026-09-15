-- 013_seed_sih_demo.sql
-- Safely seeds the SIH 2026 MANAKX Demo Scenario

DO $$ 
DECLARE
    admin_id uuid;
    reviewer_id uuid;
    officer_id uuid;
    vendor_a_id uuid;
    vendor_b_id uuid;
    vendor_c_id uuid;
    vendor_d_id uuid;
    vendor_e_id uuid;
BEGIN
    -- 1. Create/Get Users
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@manakx.demo';
    SELECT id INTO reviewer_id FROM auth.users WHERE email = 'reviewer@manakx.demo';
    SELECT id INTO officer_id FROM auth.users WHERE email = 'officer@manakx.demo';

    -- Vendor A: ABC School Furniture
    SELECT id INTO vendor_a_id FROM auth.users WHERE email = 'abc@manakx.demo';
    IF vendor_a_id IS NULL THEN
      vendor_a_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (vendor_a_id, 'authenticated', 'authenticated', 'abc@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vendor A","role":"Vendor/Supplier"}', now(), now());
    END IF;

    -- Vendor B: EduDesk
    SELECT id INTO vendor_b_id FROM auth.users WHERE email = 'edudesk@manakx.demo';
    IF vendor_b_id IS NULL THEN
      vendor_b_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (vendor_b_id, 'authenticated', 'authenticated', 'edudesk@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vendor B","role":"Vendor/Supplier"}', now(), now());
    END IF;

    -- Vendor C: National
    SELECT id INTO vendor_c_id FROM auth.users WHERE email = 'national@manakx.demo';
    IF vendor_c_id IS NULL THEN
      vendor_c_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (vendor_c_id, 'authenticated', 'authenticated', 'national@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vendor C","role":"Vendor/Supplier"}', now(), now());
    END IF;

    -- Vendor D: SmartSchool
    SELECT id INTO vendor_d_id FROM auth.users WHERE email = 'smartschool@manakx.demo';
    IF vendor_d_id IS NULL THEN
      vendor_d_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (vendor_d_id, 'authenticated', 'authenticated', 'smartschool@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vendor D","role":"Vendor/Supplier"}', now(), now());
    END IF;

    -- Vendor E: Prime
    SELECT id INTO vendor_e_id FROM auth.users WHERE email = 'prime@manakx.demo';
    IF vendor_e_id IS NULL THEN
      vendor_e_id := gen_random_uuid();
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (vendor_e_id, 'authenticated', 'authenticated', 'prime@manakx.demo', crypt('Admin@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vendor E","role":"Vendor/Supplier"}', now(), now());
    END IF;

    -- 2. Upsert Profiles
    INSERT INTO public.profiles (id, email, name, role, status, company_name, industry, phone)
    VALUES 
      (vendor_a_id, 'abc@manakx.demo', 'ABC Representative', 'Vendor/Supplier', 'ACTIVE', 'ABC School Furniture Pvt. Ltd.', 'Institutional Furniture', '9000000001'),
      (vendor_b_id, 'edudesk@manakx.demo', 'EduDesk Representative', 'Vendor/Supplier', 'ACTIVE', 'EduDesk Manufacturing Pvt. Ltd.', 'Institutional Furniture', '9000000002'),
      (vendor_c_id, 'national@manakx.demo', 'National Representative', 'Vendor/Supplier', 'ACTIVE', 'National Classroom Furniture', 'Institutional Furniture', '9000000003'),
      (vendor_d_id, 'smartschool@manakx.demo', 'SmartSchool Representative', 'Vendor/Supplier', 'ACTIVE', 'SmartSchool Furniture Works', 'Institutional Furniture', '9000000004'),
      (vendor_e_id, 'prime@manakx.demo', 'Prime Representative', 'Vendor/Supplier', 'ACTIVE', 'Prime Institutional Furniture', 'Institutional Furniture', '9000000005')
    ON CONFLICT (id) DO UPDATE SET 
      company_name = EXCLUDED.company_name,
      industry = EXCLUDED.industry;

    -- 3. Clear existing synthetic standards and insert Demo Standards
    -- First delete referencing reviews and feedback to avoid foreign key constraint errors
    DELETE FROM public.feedback WHERE standard_id IN (SELECT id FROM public.standards WHERE synthetic = true);
    DELETE FROM public.reviews WHERE standard_id IN (SELECT id FROM public.standards WHERE synthetic = true);
    DELETE FROM public.standards WHERE synthetic = true;

    INSERT INTO public.standards (id, title, category, product_domain, scope, version, status, source_type, synthetic)
    VALUES
      ('DEMO-IS-014', 'Synthetic Standard for School Student Desks', 'Furniture', 'Student desks', 'Student desk dimensions, stability, strength and general classroom furniture requirements.', '2026', 'ACTIVE', 'DEMO', true),
      ('DEMO-IS-027', 'Synthetic Standard for Steel Components in Educational Furniture', 'Materials', 'Steel school furniture', 'Steel construction, material quality, surface treatment and corrosion resistance.', '2026', 'ACTIVE', 'DEMO', true),
      ('DEMO-IS-041', 'Synthetic Standard for Safety and Testing of Classroom Furniture', 'Testing', 'Classroom furniture', 'Safety, rounded edges, stability and strength testing.', '2026', 'ACTIVE', 'DEMO', true),
      ('DEMO-IS-063', 'Synthetic General Indoor Furniture Standard', 'Furniture', 'Indoor furniture', 'General indoor furniture guidelines.', '2026', 'ACTIVE', 'DEMO', true),
      ('DEMO-IS-082', 'Synthetic Office Workstation Standard', 'Furniture', 'Office furniture', 'Office workstation dimensions and layout.', '2026', 'ACTIVE', 'DEMO', true);

    -- 4. Seed Tender Analysis
    DELETE FROM public.feedback WHERE analysis_id = 'ANL-SIH-2026';
    DELETE FROM public.reviews WHERE analysis_id = 'ANL-SIH-2026';
    DELETE FROM public.vendor_evaluations WHERE tender_id = 'ANL-SIH-2026';
    DELETE FROM public.tender_applications WHERE tender_id = 'ANL-SIH-2026';
    DELETE FROM public.requirements WHERE analysis_id = 'ANL-SIH-2026';
    DELETE FROM public.analyses WHERE id = 'ANL-SIH-2026';
    INSERT INTO public.analyses (id, tender_title, reference, category, product, input_method, source_name, spec_text, status, created_by, created_at, required_documents, evaluation_weights)
    VALUES (
      'ANL-SIH-2026', 
      'Supply of 500 Two-Seater Steel Student Desks for Government Schools', 
      'TND/EDU/2026/001', 
      'Furniture', 
      'Two-Seater Student Desk', 
      'Demo', 
      'Education Department', 
      'Government Education Department needs 500 two-seater student desks. ...', 
      'PUBLISHED', 
      'A. Sharma', 
      now() - interval '2 days',
      '[{"type":"Technical","name":"Product Datasheet","required":true},{"type":"Testing","name":"BIS Test Report (IS 4862)","required":true},{"type":"Certification","name":"ISO 9001 Certificate","required":true},{"type":"Experience","name":"Past Supply Order Proof","required":false}]'::jsonb,
      '{"technical": 50, "documentation": 15, "experience": 10, "delivery": 10, "price": 15}'::jsonb
    );

    -- 5. Requirements
    INSERT INTO public.requirements (id, analysis_id, text, type, importance, confidence, source_sentence)
    VALUES
      ('REQ-001', 'ANL-SIH-2026', 'Product: Two-Seater Student Desk', 'product', 'High', 95, 'Product: Two-Seater Student Desk'),
      ('REQ-002', 'ANL-SIH-2026', 'Quantity: 500 units', 'quantity', 'High', 95, 'Quantity: 500 units'),
      ('REQ-003', 'ANL-SIH-2026', 'Material: Steel frame / steel construction', 'material', 'High', 95, 'Material: Steel frame / steel construction'),
      ('REQ-004', 'ANL-SIH-2026', 'Writing surface: Durable laminated/engineered board', 'material', 'High', 95, 'Writing surface: Durable laminated/engineered board'),
      ('REQ-005', 'ANL-SIH-2026', 'Desk height: 750 mm', 'dimension', 'High', 95, 'Desk height: 750 mm'),
      ('REQ-006', 'ANL-SIH-2026', 'Bench/seat height: 450 mm', 'dimension', 'High', 95, 'Bench/seat height: 450 mm'),
      ('REQ-007', 'ANL-SIH-2026', 'Minimum load capacity: 100 kg', 'performance', 'High', 95, 'Minimum load capacity: 100 kg'),
      ('REQ-008', 'ANL-SIH-2026', 'Safety: Rounded/smooth edges', 'safety', 'High', 95, 'Safety: Rounded/smooth edges'),
      ('REQ-009', 'ANL-SIH-2026', 'Corrosion resistance: Required', 'testing', 'High', 95, 'Corrosion resistance: Required'),
      ('REQ-010', 'ANL-SIH-2026', 'Application: Indoor classroom use', 'environmental', 'Medium', 90, 'Application: Indoor classroom use'),
      ('REQ-011', 'ANL-SIH-2026', 'Strength/stability testing: Required', 'testing', 'High', 95, 'Strength/stability testing: Required'),
      ('REQ-012', 'ANL-SIH-2026', 'Warranty: Minimum 3 years', 'warranty', 'Medium', 90, 'Warranty: Minimum 3 years'),
      ('REQ-013', 'ANL-SIH-2026', 'Delivery: Within 45 days', 'delivery', 'Medium', 90, 'Delivery: Within 45 days');

    -- 6. Vendor Products
    DELETE FROM public.products WHERE vendor_id IN (vendor_a_id, vendor_b_id, vendor_c_id, vendor_d_id, vendor_e_id);
    INSERT INTO public.products (vendor_id, name, category, status) VALUES 
      (vendor_a_id, 'ABC-SD750', 'Furniture', 'PUBLISHED'),
      (vendor_b_id, 'EDU-DESK-750', 'Furniture', 'PUBLISHED'),
      (vendor_c_id, 'NCF-700', 'Furniture', 'PUBLISHED'),
      (vendor_d_id, 'SSF-750', 'Furniture', 'PUBLISHED'),
      (vendor_e_id, 'PIF-750', 'Furniture', 'PUBLISHED');

    -- 7. Tender Applications
    INSERT INTO public.tender_applications (tender_id, vendor_id, product_id, status, submitted_at)
    SELECT 'ANL-SIH-2026', p.vendor_id, p.id, 'SUBMITTED', now() - interval '1 day'
    FROM public.products p
    WHERE p.vendor_id IN (vendor_a_id, vendor_b_id, vendor_c_id, vendor_d_id, vendor_e_id);

    -- 8. Vendor Evaluations
    INSERT INTO public.vendor_evaluations (application_id, tender_id, vendor_id, overall_score, technical_score, documentation_score, experience_score, delivery_score, price_score, risk_level, recommendation, rank, confidence)
    SELECT 
      ta.id, 'ANL-SIH-2026', ta.vendor_id,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 95 
        WHEN vendor_b_id THEN 88 
        WHEN vendor_d_id THEN 82 
        WHEN vendor_e_id THEN 75 
        WHEN vendor_c_id THEN 45 
      END as overall,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 98 WHEN vendor_b_id THEN 95 WHEN vendor_d_id THEN 95 WHEN vendor_e_id THEN 80 WHEN vendor_c_id THEN 40 END as tech,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 100 WHEN vendor_b_id THEN 90 WHEN vendor_d_id THEN 50 WHEN vendor_e_id THEN 70 WHEN vendor_c_id THEN 90 END as doc,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 90 WHEN vendor_b_id THEN 100 WHEN vendor_d_id THEN 80 WHEN vendor_e_id THEN 60 WHEN vendor_c_id THEN 85 END as exp,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 90 WHEN vendor_b_id THEN 80 WHEN vendor_d_id THEN 85 WHEN vendor_e_id THEN 80 WHEN vendor_c_id THEN 100 END as del,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 70 WHEN vendor_b_id THEN 80 WHEN vendor_d_id THEN 75 WHEN vendor_e_id THEN 85 WHEN vendor_c_id THEN 100 END as prc,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 'Low' WHEN vendor_b_id THEN 'Low' WHEN vendor_d_id THEN 'Medium' WHEN vendor_e_id THEN 'Medium' WHEN vendor_c_id THEN 'High' END as risk,
      CASE ta.vendor_id 
        WHEN vendor_c_id THEN 'Reject - Fails mandatory technical requirements (Load capacity and height)'
        WHEN vendor_d_id THEN 'Acceptable - Missing test report, request documentation'
        ELSE 'Strongly Recommended' END as rec,
      CASE ta.vendor_id 
        WHEN vendor_a_id THEN 1 WHEN vendor_b_id THEN 2 WHEN vendor_d_id THEN 3 WHEN vendor_e_id THEN 4 WHEN vendor_c_id THEN 5 END as rank,
      95 as confidence
    FROM public.tender_applications ta
    WHERE ta.tender_id = 'ANL-SIH-2026';

END $$;
