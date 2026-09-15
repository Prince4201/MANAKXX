-- 010_vendor_products.sql
-- Create tables for Vendor Products, Documents, and Specifications

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  category text NOT NULL,
  subcategory text,
  manufacturer text,
  model_number text,
  description text,
  status text NOT NULL DEFAULT 'DRAFT', -- DRAFT, NEEDS_DOCUMENT, READY, INACTIVE
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can do all on own products"
  ON public.products
  FOR ALL
  USING (vendor_id = auth.uid());

-- 2. Create Product Documents Table
CREATE TABLE IF NOT EXISTS public.product_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- DATASHEET, TECHNICAL_SPECIFICATION, TEST_REPORT, CERTIFICATE, OTHER
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for product_documents
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can do all on own documents"
  ON public.product_documents
  FOR ALL
  USING (vendor_id = auth.uid());

-- 3. Create Product Specifications Table (Preparation for ML)
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parameter text NOT NULL,
  value text NOT NULL,
  unit text,
  normalized_value text,
  source_document_id uuid REFERENCES public.product_documents(id) ON DELETE SET NULL,
  source_text text,
  confidence integer,
  is_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for product_specifications
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can do all on own specifications"
  ON public.product_specifications
  FOR ALL
  USING (vendor_id = auth.uid());

-- 4. Create Storage Bucket for Vendor Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor_documents', 
  'vendor_documents', 
  false, 
  52428800, -- 50MB
  '{"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"}'
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage RLS Policies
-- Allow users to upload, read, update, delete files in their own folder (folder name = auth.uid())
CREATE POLICY "Vendors can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vendor_documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Vendors can update own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vendor_documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Vendors can read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor_documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Vendors can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vendor_documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- Add trigger for products updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_product_update
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
