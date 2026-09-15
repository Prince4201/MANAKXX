-- 011_vendor_assessments.sql
-- Create tables for Vendor AI Self-Assessments

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  procurement_id text NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'DRAFT', -- DRAFT, PROCESSING, COMPLETED, FAILED
  overall_score integer,
  confidence integer,
  engine_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS for assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can do all on own assessments" ON public.assessments;
CREATE POLICY "Vendors can do all on own assessments"
  ON public.assessments
  FOR ALL
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- 2. Create Assessment Results Table (Requirement-by-Requirement)
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  requirement_id text NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  status text NOT NULL, -- MATCH, PARTIAL, MISSING, WARNING, NOT_ASSESSABLE
  score integer,
  product_value text,
  required_value text,
  unit text,
  evidence text,
  explanation text,
  source_document_id uuid REFERENCES public.product_documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for assessment_results
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can do all on own assessment results" ON public.assessment_results;
CREATE POLICY "Vendors can do all on own assessment results"
  ON public.assessment_results
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_results.assessment_id
      AND a.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_results.assessment_id
      AND a.vendor_id = auth.uid()
    )
  );

-- Add trigger for assessments updated_at
CREATE OR REPLACE FUNCTION public.handle_assessment_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_assessment_update ON public.assessments;
CREATE TRIGGER on_assessment_update
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_assessment_updated_at();

CREATE INDEX IF NOT EXISTS assessments_vendor_id_created_at_idx
  ON public.assessments (vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS assessments_procurement_id_idx
  ON public.assessments (procurement_id);

CREATE INDEX IF NOT EXISTS assessments_product_id_idx
  ON public.assessments (product_id);

CREATE INDEX IF NOT EXISTS assessment_results_assessment_id_idx
  ON public.assessment_results (assessment_id);

NOTIFY pgrst, 'reload schema';
