-- =============================================================================
-- SignalDesk CRM — initial PostgreSQL schema (Supabase)
-- Apply with Supabase CLI (`supabase db push`) or paste into the SQL Editor.
-- This migration is written for a fresh project; run it once.
-- =============================================================================

create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type public.user_role as enum ('admin', 'sales_rep');
create type public.lead_status as enum ('new', 'contacted', 'interested', 'negotiation', 'converted', 'lost');
create type public.lead_priority as enum ('low', 'medium', 'high');
create type public.lead_source as enum (
  'website', 'referral', 'linkedin', 'cold-call', 'email-campaign', 'trade-show', 'partner'
);
create type public.activity_type as enum ('call', 'email', 'meeting', 'note');
create type public.follow_up_type as enum ('call', 'email', 'meeting', 'demo', 'proposal');

-- ─── Timestamp helper ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role public.user_role not null default 'sales_rep',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_key unique (email),
  constraint profiles_full_name_length check (char_length(full_name) <= 160),
  constraint profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 500)
);

comment on table public.profiles is 'Application profile linked 1:1 to auth.users. Role defaults to sales_rep.';

-- ─── leads ──────────────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company text not null,
  job_title text,
  source public.lead_source not null default 'website',
  status public.lead_status not null default 'new',
  priority public.lead_priority not null default 'medium',
  notes text,
  deal_value numeric(14, 2),
  location text,
  website text,
  tags text[] not null default '{}',
  created_by uuid not null,
  assigned_to uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  normalized_email text generated always as (lower(btrim(email))) stored,
  constraint leads_full_name_length check (char_length(full_name) between 1 and 160),
  constraint leads_email_format check (position('@' in email) > 1 and char_length(email) <= 254),
  constraint leads_company_length check (char_length(company) between 1 and 160),
  constraint leads_deal_value_non_negative check (deal_value is null or deal_value >= 0),
  constraint leads_created_by_fkey foreign key (created_by) references public.profiles (id) on delete restrict,
  constraint leads_assigned_to_fkey foreign key (assigned_to) references public.profiles (id) on delete restrict
);

comment on column public.leads.normalized_email is 'Lowercased email used for duplicate detection during CSV import (not unique by design).';

-- ─── activities ─────────────────────────────────────────────────────────────
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  type public.activity_type not null,
  subject text not null,
  description text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint activities_subject_length check (char_length(subject) between 1 and 200)
);

-- ─── follow_ups ─────────────────────────────────────────────────────────────
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  title text not null,
  description text,
  type public.follow_up_type not null default 'call',
  due_at timestamptz not null,
  priority public.lead_priority not null default 'medium',
  assigned_to uuid not null,
  completed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_ups_title_length check (char_length(title) between 1 and 200),
  constraint follow_ups_lead_id_fkey foreign key (lead_id) references public.leads (id) on delete cascade,
  constraint follow_ups_assigned_to_fkey foreign key (assigned_to) references public.profiles (id) on delete restrict,
  constraint follow_ups_created_by_fkey foreign key (created_by) references public.profiles (id) on delete restrict
);

comment on table public.follow_ups is 'Overdue is derived: completed_at IS NULL AND due_at < now(). No stored overdue status.';

-- ─── ai_insights ────────────────────────────────────────────────────────────
create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  score smallint not null,
  conversion_probability smallint not null,
  summary text not null,
  reasoning text not null,
  next_best_action text not null,
  suggested_message text not null,
  positive_signals jsonb not null default '[]'::jsonb,
  risk_factors jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  model text not null,
  provider text not null default 'gemini',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  constraint ai_insights_score_range check (score between 1 and 100),
  constraint ai_insights_probability_range check (conversion_probability between 0 and 100),
  constraint ai_insights_provider_check check (provider in ('gemini', 'mock')),
  constraint ai_insights_arrays check (
    jsonb_typeof(positive_signals) = 'array'
    and jsonb_typeof(risk_factors) = 'array'
    and jsonb_typeof(missing_information) = 'array'
  )
);

comment on table public.ai_insights is 'Append-only AI snapshots. Never treated as authoritative CRM facts.';

-- ─── Indexes ────────────────────────────────────────────────────────────────
create index leads_status_idx on public.leads (status);
create index leads_priority_idx on public.leads (priority);
create index leads_source_idx on public.leads (source);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_created_by_idx on public.leads (created_by);
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_normalized_email_idx on public.leads (normalized_email);
create index activities_lead_occurred_idx on public.activities (lead_id, occurred_at desc);
create index activities_created_by_idx on public.activities (created_by);
create index follow_ups_assigned_open_idx on public.follow_ups (assigned_to, completed_at, due_at);
create index follow_ups_lead_idx on public.follow_ups (lead_id);
create index follow_ups_due_at_idx on public.follow_ups (due_at);
create index ai_insights_lead_created_idx on public.ai_insights (lead_id, created_at desc);

-- ─── updated_at triggers ────────────────────────────────────────────────────
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create trigger follow_ups_set_updated_at
  before update on public.follow_ups
  for each row execute function public.set_updated_at();

-- ─── Profile creation on signup (always sales_rep) ──────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    'sales_rep'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Role / assignment guards ───────────────────────────────────────────────
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role then
    -- auth.uid() is null for trusted SQL Editor / service-role maintenance.
    if auth.uid() is not null then
      if new.id = auth.uid() then
        raise exception 'Users cannot change their own role';
      elsif not public.is_admin() then
        raise exception 'Only admins can change roles';
      end if;
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

create or replace function public.enforce_lead_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' and new.assigned_to <> auth.uid() then
      raise exception 'Only admins can assign leads to other users';
    end if;
    if tg_op = 'UPDATE' and new.assigned_to is distinct from old.assigned_to then
      raise exception 'Only admins can reassign leads';
    end if;
  end if;
  return new;
end;
$$;

create trigger leads_enforce_assignment
  before insert or update on public.leads
  for each row execute function public.enforce_lead_assignment();

-- ─── SECURITY DEFINER helpers (avoid recursive RLS) ─────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_access_lead(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.leads l
    where l.id = p_lead_id
      and (public.is_admin() or l.created_by = auth.uid() or l.assigned_to = auth.uid())
  );
$$;

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.follow_ups enable row level security;
alter table public.ai_insights enable row level security;

-- profiles: authenticated team directory; self/admin updates; role guarded by trigger.
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (auth.uid() is not null);

create policy "profiles_update_self_or_admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- leads: admins see all; reps see leads they created or are assigned.
create policy "leads_select_permitted"
  on public.leads for select to authenticated
  using (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid());

create policy "leads_insert_permitted"
  on public.leads for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.is_admin() or assigned_to = auth.uid())
  );

create policy "leads_update_permitted"
  on public.leads for update to authenticated
  using (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid())
  with check (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid());

create policy "leads_delete_permitted"
  on public.leads for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- activities: visible when the parent lead is visible; authored records editable by author/admin.
create policy "activities_select_permitted"
  on public.activities for select to authenticated
  using (public.can_access_lead(lead_id));

create policy "activities_insert_permitted"
  on public.activities for insert to authenticated
  with check (created_by = auth.uid() and public.can_access_lead(lead_id));

create policy "activities_update_permitted"
  on public.activities for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());

create policy "activities_delete_permitted"
  on public.activities for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- follow-ups: admins all; reps see assigned or created records.
create policy "follow_ups_select_permitted"
  on public.follow_ups for select to authenticated
  using (public.is_admin() or assigned_to = auth.uid() or created_by = auth.uid());

create policy "follow_ups_insert_permitted"
  on public.follow_ups for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.is_admin() or assigned_to = auth.uid())
    and public.can_access_lead(lead_id)
  );

create policy "follow_ups_update_permitted"
  on public.follow_ups for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid())
  with check (public.is_admin() or assigned_to = auth.uid());

create policy "follow_ups_delete_permitted"
  on public.follow_ups for delete to authenticated
  using (public.is_admin() or assigned_to = auth.uid());

-- ai_insights: append-only snapshots scoped to accessible leads.
create policy "ai_insights_select_permitted"
  on public.ai_insights for select to authenticated
  using (public.can_access_lead(lead_id));

create policy "ai_insights_insert_permitted"
  on public.ai_insights for insert to authenticated
  with check (created_by = auth.uid() and public.can_access_lead(lead_id));

-- ─── Grants ─────────────────────────────────────────────────────────────────
revoke all on public.profiles, public.leads, public.activities, public.follow_ups, public.ai_insights from anon;
grant select, insert, update, delete on public.profiles, public.leads, public.activities, public.follow_ups, public.ai_insights to authenticated;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.can_access_lead(uuid) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
revoke all on function public.enforce_lead_assignment() from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_access_lead(uuid) to authenticated;

-- ─── Initial admin promotion (manual, controlled) ───────────────────────────
-- 1. Sign up through the app (the new profile becomes sales_rep).
-- 2. Run the statement below in the Supabase SQL Editor, replacing the email.
--    SQL Editor runs without an auth.uid(), so the guard allows this operation.
--
--   update public.profiles set role = 'admin' where email = 'you@company.com';
--
-- Do not expose a self-service role-escalation endpoint.
