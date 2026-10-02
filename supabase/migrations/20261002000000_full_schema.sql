-- =============================================================================
-- Workify: Full database schema, RLS, triggers, and seed data
-- Review before applying.  DO NOT apply without reading.
-- =============================================================================

-- ─── Helper: updated_at trigger function ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── Helper: is_admin() ─────────────────────────────────────────────────────
-- SECURITY DEFINER with fixed search_path so it can't be tricked.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
end;
$$;


-- =============================================================================
-- TABLES
-- =============================================================================

-- ─── profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  handle      text unique,
  bio         text default '',
  avatar_url  text default '',
  college     text default '',
  location    text default '',
  skills      text[] default '{}',
  linkedin_url text default '',
  x_url       text default '',
  website_url text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- handle validation: lowercase, 3-20 chars, [a-z0-9_]
  constraint handle_format check (
    handle is null or handle ~ '^[a-z0-9_]{3,20}$'
  )
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ─── admin_users ─────────────────────────────────────────────────────────────
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);


-- ─── workshops ───────────────────────────────────────────────────────────────
create table public.workshops (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  host_name         text not null,
  mode              text not null default 'Online — Google Meet',
  starts_at         timestamptz,
  ends_at           timestamptz,
  timezone          text default 'Asia/Kolkata',
  status            text not null default 'open'
                    check (status in ('open', 'coming_soon', 'cancelled')),
  short_description text default '',
  full_description  text default '',
  tags              text[] default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger workshops_updated_at
  before update on public.workshops
  for each row execute function public.set_updated_at();


-- ─── workshop_links (Meet URL — sensitive) ───────────────────────────────────
create table public.workshop_links (
  workshop_id uuid primary key references public.workshops(id) on delete cascade,
  meet_url    text not null default ''
);


-- ─── registrations ───────────────────────────────────────────────────────────
create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, workshop_id)
);


-- ─── linkedin_reviews ────────────────────────────────────────────────────────
create table public.linkedin_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  workshop_id   uuid not null references public.workshops(id) on delete cascade,
  linkedin_url  text not null default '',
  overall_score integer not null default 0,
  band          text not null default 'Needs work',
  criteria      jsonb not null default '{}',
  strengths     text not null default '',
  improvements  text not null default '',
  created_at    timestamptz not null default now(),
  unique (user_id, workshop_id)
);


-- =============================================================================
-- TRIGGER: auto-create profile on new auth user
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- ─── profiles RLS ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Users can update their own profile (never touches admin status)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ─── admin_users RLS ─────────────────────────────────────────────────────────
alter table public.admin_users enable row level security;

-- Only admins can read admin_users
create policy "Admins can read admin_users"
  on public.admin_users for select
  using (public.is_admin());

-- No client writes at all (managed via SQL editor / service role only)


-- ─── workshops RLS ───────────────────────────────────────────────────────────
alter table public.workshops enable row level security;

-- Any signed-in user can read workshops
create policy "Signed-in users can read workshops"
  on public.workshops for select
  using (auth.uid() is not null);

-- Only admins can insert workshops
create policy "Admins can insert workshops"
  on public.workshops for insert
  with check (public.is_admin());

-- Only admins can update workshops
create policy "Admins can update workshops"
  on public.workshops for update
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete workshops
create policy "Admins can delete workshops"
  on public.workshops for delete
  using (public.is_admin());


-- ─── workshop_links RLS ──────────────────────────────────────────────────────
alter table public.workshop_links enable row level security;

-- Registered users can read links for workshops they're registered for
create policy "Registered users can read workshop links"
  on public.workshop_links for select
  using (
    exists (
      select 1 from public.registrations
      where registrations.workshop_id = workshop_links.workshop_id
        and registrations.user_id = auth.uid()
    )
  );

-- Admins can read all workshop links
create policy "Admins can read all workshop links"
  on public.workshop_links for select
  using (public.is_admin());

-- Only admins can insert/update/delete workshop links
create policy "Admins can insert workshop links"
  on public.workshop_links for insert
  with check (public.is_admin());

create policy "Admins can update workshop links"
  on public.workshop_links for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete workshop links"
  on public.workshop_links for delete
  using (public.is_admin());


-- ─── registrations RLS ───────────────────────────────────────────────────────
alter table public.registrations enable row level security;

-- Users can read their own registrations
create policy "Users can read own registrations"
  on public.registrations for select
  using (auth.uid() = user_id);

-- Admins can read all registrations
create policy "Admins can read all registrations"
  on public.registrations for select
  using (public.is_admin());

-- Users can insert their own registrations
create policy "Users can insert own registrations"
  on public.registrations for insert
  with check (auth.uid() = user_id);

-- Users can delete their own registrations
create policy "Users can delete own registrations"
  on public.registrations for delete
  using (auth.uid() = user_id);


-- ─── linkedin_reviews RLS ────────────────────────────────────────────────────
alter table public.linkedin_reviews enable row level security;

-- Users can read their own reviews
create policy "Users can read own reviews"
  on public.linkedin_reviews for select
  using (auth.uid() = user_id);

-- Admins can read all reviews
create policy "Admins can read all reviews"
  on public.linkedin_reviews for select
  using (public.is_admin());

-- NO client insert/update policies
-- Only the Edge Function with the service_role key writes to this table.

-- Admins can delete reviews (to allow reset)
create policy "Admins can delete reviews"
  on public.linkedin_reviews for delete
  using (public.is_admin());


-- =============================================================================
-- SEED DATA
-- =============================================================================

-- LinkedIn Workshop (the real first workshop)
-- Using the date from the plan: Friday 2 Oct 2026, 7:30-8:30 pm IST
-- IST = UTC+5:30, so 7:30 pm IST = 14:00 UTC, 8:30 pm IST = 15:00 UTC
insert into public.workshops (slug, title, host_name, mode, starts_at, ends_at, timezone, status, short_description, full_description, tags)
values (
  'linkedin-workshop',
  'LinkedIn Workshop',
  'F1 Forge',
  'Online — Google Meet',
  '2026-10-02 14:00:00+00',
  '2026-10-02 15:00:00+00',
  'Asia/Kolkata',
  'open',
  'Master modern professional presence, builder visibility, and technical networking with the F1 Forge team.',
  'An interactive, high-impact session on engineering your online presence, positioning your technical builds, and connecting with tech founders, hiring managers, and collaborators.',
  ARRAY['LinkedIn', 'Networking', 'Career Growth', 'Builder Profile']
);

-- Coming-soon placeholder
insert into public.workshops (slug, title, host_name, mode, timezone, status, short_description, full_description, tags)
values (
  'coming-soon',
  'Other tracks — coming soon',
  'Workify',
  'Online — Google Meet',
  'Asia/Kolkata',
  'coming_soon',
  'New hands-on workshops across AI Agents, Generative AI, Automation, and Cloud are currently in development.',
  'Additional specialized tracks are currently being prepared with partner engineering teams. Check back soon for announcements.',
  ARRAY['AI Agents', 'Gen AI', 'Automation', 'Cloud']
);


-- =============================================================================
-- MANUAL: Make yourself admin (run this yourself after signing in)
-- =============================================================================
-- Replace <YOUR_USER_ID> with your actual auth.users.id (visible in Supabase dashboard > Authentication > Users)
--
-- insert into public.admin_users (user_id) values ('<YOUR_USER_ID>');
--
-- ⚠ DO NOT put the Meet URL in this file. Add it via the Admin page or SQL editor:
-- insert into public.workshop_links (workshop_id, meet_url)
-- values ('<workshop-uuid>', 'https://meet.google.com/xxx-xxxx-xxx');
