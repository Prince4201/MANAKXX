-- ManakX Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (Optional: can link to auth.users later)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  role text not null,
  created_at timestamptz default now()
);

-- Standards
create table public.standards (
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
create table public.analyses (
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
create table public.requirements (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  text text not null,
  type text not null,
  importance text not null,
  confidence integer not null,
  source_sentence text not null
);

-- Recommendations
create table public.recommendations (
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
create table public.requirement_matches (
  id uuid primary key default uuid_generate_v4(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  requirement_id text not null references public.requirements(id) on delete cascade,
  requirement_text text not null,
  strength text not null,
  score integer not null,
  evidence text not null
);

-- Gaps
create table public.gaps (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  area text not null,
  severity text not null,
  reason text not null,
  recommended_review text not null
);

-- Conflicts
create table public.conflicts (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  title text not null,
  severity text not null,
  detail text not null,
  recommendation text not null
);

-- Reviews
create table public.reviews (
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
create table public.feedback (
  id text primary key,
  analysis_id text not null references public.analyses(id) on delete cascade,
  standard_id text not null references public.standards(id),
  kind text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

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

-- Create policies to allow all operations (for demo/development)
create policy "Allow all on users" on public.users for all using (true) with check (true);
create policy "Allow all on standards" on public.standards for all using (true) with check (true);
create policy "Allow all on analyses" on public.analyses for all using (true) with check (true);
create policy "Allow all on requirements" on public.requirements for all using (true) with check (true);
create policy "Allow all on recommendations" on public.recommendations for all using (true) with check (true);
create policy "Allow all on requirement_matches" on public.requirement_matches for all using (true) with check (true);
create policy "Allow all on gaps" on public.gaps for all using (true) with check (true);
create policy "Allow all on conflicts" on public.conflicts for all using (true) with check (true);
create policy "Allow all on reviews" on public.reviews for all using (true) with check (true);
create policy "Allow all on feedback" on public.feedback for all using (true) with check (true);
