-- ManakX Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (Optional: can link to auth.users later)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  role text not null,
  created_at timestamptz default now()
);

-- Standards
create table if not exists public.standards (
  id text primary key,
  title text not null,
  category text not null,
  product_domain text not null,
  scope text not null,
  keywords jsonb not null default '[]'::jsonb,
  requirement_areas jsonb not null default '[]'::jsonb,
  applicable_products jsonb not null default '[]'::jsonb,
  related_standards jsonb not null default '[]'::jsonb,
  version text not null,
  status text not null,
  source_type text not null,
  last_updated timestamptz not null default now(),
  synthetic boolean not null default false
);

-- Analyses
create table if not exists public.analyses (
  id text primary key,
  tender_title text not null,
  reference text not null,
  category text not null,
  product text not null,
  input_method text not null,
  source_name text not null,
  spec_text text not null,
  status text not null,
  created_by text not null, -- Currently a string name in the demo, can be migrated to uuid referencing users.id later
  created_at timestamptz not null default now()
);

-- Requirements
create table if not exists public.requirements (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  text text not null,
  type text not null,
  importance text not null,
  confidence integer not null,
  source_sentence text not null
);

-- Recommendations
create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  analysis_id text not null references public.analyses(id) on delete cascade,
  standard_id text not null references public.standards(id),
  relevance integer not null,
  confidence integer not null,
  coverage integer not null,
  breakdown jsonb not null,
  why text not null,
  band text not null
);

-- Requirement Matches
create table if not exists public.requirement_matches (
  id uuid primary key default uuid_generate_v4(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  requirement_id text not null references public.requirements(id) on delete cascade,
  requirement_text text not null,
  strength text not null,
  score integer not null,
  evidence text not null
);

-- Gaps
create table if not exists public.gaps (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  area text not null,
  severity text not null,
  reason text not null,
  recommended_review text not null
);

-- Conflicts
create table if not exists public.conflicts (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  title text not null,
  severity text not null,
  detail text not null,
  recommendation text not null
);

-- Reviews
create table if not exists public.reviews (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  standard_id text not null references public.standards(id),
  ai_score integer not null,
  reviewer text not null,
  decision text not null,
  comment text not null,
  updated_at timestamptz not null default now()
);

-- Feedback
create table if not exists public.feedback (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  standard_id text not null references public.standards(id),
  kind text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

-- Vendor Products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text,
  category text not null,
  subcategory text,
  manufacturer text,
  model_number text,
  description text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_documents (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  file_type text,
  file_size integer,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_specifications (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  parameter text not null,
  value text not null,
  unit text,
  normalized_value text,
  source_document_id uuid references public.product_documents(id) on delete set null,
  source_text text,
  confidence integer,
  is_manual boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_product_update on public.products;
create trigger on_product_update
  before update on public.products
  for each row
  execute procedure public.handle_updated_at();

-- Vendor Self-Assessments
create table if not exists public.assessments (
  id uuid primary key default uuid_generate_v4(),
  procurement_id text not null references public.analyses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'DRAFT',
  overall_score integer,
  confidence integer,
  engine_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.assessment_results (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  requirement_id text not null references public.requirements(id) on delete cascade,
  status text not null,
  score integer,
  product_value text,
  required_value text,
  unit text,
  evidence text,
  explanation text,
  source_document_id uuid references public.product_documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_assessment_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_assessment_update on public.assessments;
create trigger on_assessment_update
  before update on public.assessments
  for each row
  execute procedure public.handle_assessment_updated_at();

create index if not exists products_vendor_id_created_at_idx
  on public.products (vendor_id, created_at desc);

create index if not exists product_documents_product_id_idx
  on public.product_documents (product_id);

create index if not exists product_specifications_product_id_idx
  on public.product_specifications (product_id);

create index if not exists assessments_vendor_id_created_at_idx
  on public.assessments (vendor_id, created_at desc);

create index if not exists assessments_procurement_id_idx
  on public.assessments (procurement_id);

create index if not exists assessments_product_id_idx
  on public.assessments (product_id);

create index if not exists assessment_results_assessment_id_idx
  on public.assessment_results (assessment_id);

-- Enable Row Level Security (RLS) but allow all for demo purposes initially
alter table public.users enable row level security;
alter table public.standards enable row level security;
alter table public.analyses enable row level security;
alter table public.requirements enable row level security;
alter table public.recommendations enable row level security;
alter table public.requirement_matches enable row level security;
alter table public.gaps enable row level security;
alter table public.conflicts enable row level security;
alter table public.reviews enable row level security;
alter table public.feedback enable row level security;
alter table public.products enable row level security;
alter table public.product_documents enable row level security;
alter table public.product_specifications enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_results enable row level security;

-- Create policies to allow all operations (for demo/development)
drop policy if exists "Allow all on users" on public.users;
create policy "Allow all on users" on public.users for all using (true) with check (true);

drop policy if exists "Allow all on standards" on public.standards;
create policy "Allow all on standards" on public.standards for all using (true) with check (true);

drop policy if exists "Allow all on analyses" on public.analyses;
create policy "Allow all on analyses" on public.analyses for all using (true) with check (true);

drop policy if exists "Allow all on requirements" on public.requirements;
create policy "Allow all on requirements" on public.requirements for all using (true) with check (true);

drop policy if exists "Allow all on recommendations" on public.recommendations;
create policy "Allow all on recommendations" on public.recommendations for all using (true) with check (true);

drop policy if exists "Allow all on requirement_matches" on public.requirement_matches;
create policy "Allow all on requirement_matches" on public.requirement_matches for all using (true) with check (true);

drop policy if exists "Allow all on gaps" on public.gaps;
create policy "Allow all on gaps" on public.gaps for all using (true) with check (true);

drop policy if exists "Allow all on conflicts" on public.conflicts;
create policy "Allow all on conflicts" on public.conflicts for all using (true) with check (true);

drop policy if exists "Allow all on reviews" on public.reviews;
create policy "Allow all on reviews" on public.reviews for all using (true) with check (true);

drop policy if exists "Allow all on feedback" on public.feedback;
create policy "Allow all on feedback" on public.feedback for all using (true) with check (true);

drop policy if exists "Vendors can do all on own products" on public.products;
create policy "Vendors can do all on own products"
  on public.products for all
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

drop policy if exists "Vendors can do all on own documents" on public.product_documents;
create policy "Vendors can do all on own documents"
  on public.product_documents for all
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

drop policy if exists "Vendors can do all on own specifications" on public.product_specifications;
create policy "Vendors can do all on own specifications"
  on public.product_specifications for all
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

drop policy if exists "Vendors can do all on own assessments" on public.assessments;
create policy "Vendors can do all on own assessments"
  on public.assessments for all
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

drop policy if exists "Vendors can do all on own assessment results" on public.assessment_results;
create policy "Vendors can do all on own assessment results"
  on public.assessment_results for all
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_results.assessment_id
      and a.vendor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_results.assessment_id
      and a.vendor_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
