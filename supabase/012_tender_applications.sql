-- 012_tender_applications.sql

-- 1. Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor_documents', 'vendor_documents', false) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects for the bucket
-- Note: Assuming storage.objects already has RLS enabled by default in Supabase

-- Policy: Vendors can insert/read/update/delete their own documents
DROP POLICY IF EXISTS "Vendors manage own documents" ON storage.objects;
CREATE POLICY "Vendors manage own documents"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'vendor_documents' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'vendor_documents' AND auth.uid() = owner);

-- Policy: Officers and Reviewers can read submitted vendor documents
DROP POLICY IF EXISTS "Procurement staff read documents" ON storage.objects;
CREATE POLICY "Procurement staff read documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'vendor_documents' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('Government Procurement Officer', 'Technical Reviewer', 'Admin')
    )
  );


-- 2. Update Analyses Status and add new columns
ALTER TABLE public.analyses 
  ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_weights JSONB DEFAULT '{"technical": 50, "documentation": 15, "experience": 10, "delivery": 10, "price": 15}'::jsonb;

-- Migrate existing statuses to the new upper-case structured workflow
UPDATE public.analyses SET status = 'DRAFT' WHERE status ILIKE 'Draft';
UPDATE public.analyses SET status = 'UNDER_REVIEW' WHERE status ILIKE 'Completed' OR status ILIKE 'Needs Review';
UPDATE public.analyses SET status = 'APPROVED' WHERE status ILIKE 'Approved';
-- Any other status defaults to DRAFT for safety if it doesn't match above, but we'll leave as is.


-- 3. Create Tender Applications Table
CREATE TABLE IF NOT EXISTS public.tender_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id text NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  status text NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, UNDER_REVIEW, SHORTLISTED, NOT_SHORTLISTED, WITHDRAWN
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tender_id, vendor_id, product_id)
);

ALTER TABLE public.tender_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can do all on own applications" ON public.tender_applications;
CREATE POLICY "Vendors can do all on own applications"
  ON public.tender_applications
  FOR ALL
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Officers and Reviewers can read applications" ON public.tender_applications;
CREATE POLICY "Officers and Reviewers can read applications"
  ON public.tender_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('Government Procurement Officer', 'Technical Reviewer', 'Admin')
    )
  );

CREATE OR REPLACE FUNCTION public.handle_tender_app_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_tender_app_update ON public.tender_applications;
CREATE TRIGGER on_tender_app_update
  BEFORE UPDATE ON public.tender_applications
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_tender_app_updated_at();


-- 4. Create Vendor Evaluations Table
CREATE TABLE IF NOT EXISTS public.vendor_evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES public.tender_applications(id) ON DELETE CASCADE,
  tender_id text NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_version text,
  technical_score integer,
  documentation_score integer,
  experience_score integer,
  delivery_score integer,
  price_score integer,
  overall_score integer,
  confidence integer,
  risk_level text,
  rank integer,
  recommendation text,
  evaluation_timestamp timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE public.vendor_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officers and Reviewers manage evaluations" ON public.vendor_evaluations;
CREATE POLICY "Officers and Reviewers manage evaluations"
  ON public.vendor_evaluations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('Government Procurement Officer', 'Technical Reviewer', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('Government Procurement Officer', 'Technical Reviewer', 'Admin')
    )
  );

-- Vendors should NEVER see this table, so no policy for them.

NOTIFY pgrst, 'reload schema';
