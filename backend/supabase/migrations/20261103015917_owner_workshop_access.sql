-- Workify owner-only publishing. No workshop or user records are created/deleted.
-- Inspect remote schema/policies/history before applying to the existing project.
-- Refuse ambiguous ownership rather than choosing or removing an existing admin.
do $$ begin
  if (select count(*) from public.admin_users) > 1 then
    raise exception 'Multiple admin accounts exist. Confirm the intended owner before applying.';
  end if;
end $$;
create unique index if not exists workify_single_admin on public.admin_users ((true));

-- Remove recursive/legacy policies on the role source and publishing tables.
do $$ declare item record; begin
  for item in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('admin_users','workshops','workshop_links')
  loop execute format('drop policy %I on %I.%I', item.policyname, item.schemaname, item.tablename); end loop;
end $$;

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
create policy "Read own admin membership" on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

-- Invoker security avoids privileged public RPCs and role-policy recursion.
create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path = ''
as $$ select (select auth.uid()) is not null and exists (
  select 1 from public.admin_users where user_id = (select auth.uid())
); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.workshops enable row level security;
revoke all on public.workshops from anon, authenticated;
grant select on public.workshops to anon, authenticated;
grant insert, update on public.workshops to authenticated;
create policy "Public workshop metadata" on public.workshops for select to anon, authenticated using (true);
create policy "Owner creates workshops" on public.workshops for insert to authenticated with check ((select public.is_admin()));
create policy "Owner updates workshops" on public.workshops for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- No DELETE grant or policy: cancellation/archival preserves registration history.

alter table public.workshops drop constraint if exists workshops_status_check;
alter table public.workshops add constraint workshops_status_check check (status in ('open','coming_soon','cancelled','archived')) not valid;
alter table public.workshops add constraint workify_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100) not valid;
alter table public.workshops add constraint workify_workshop_text check (
  length(btrim(title)) between 1 and 200 and length(btrim(host_name)) between 1 and 100
  and length(coalesce(short_description,'')) <= 500 and length(coalesce(full_description,'')) <= 20000
) not valid;
alter table public.workshops add constraint workify_workshop_schedule check (
  (starts_at is null and ends_at is null and status <> 'open') or (starts_at is not null and ends_at is not null and ends_at > starts_at)
) not valid;

create or replace function public.validate_workify_workshop() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.timezone is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Choose a valid IANA timezone.' using errcode = '23514';
  end if;
  if cardinality(new.tags) > 12 or exists (select 1 from unnest(new.tags) tag where tag is null or length(btrim(tag)) not between 1 and 40) then
    raise exception 'Use up to 12 tags of 1-40 characters.' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function public.validate_workify_workshop() from public, anon, authenticated;
create trigger workify_validate_workshop before insert or update on public.workshops for each row execute function public.validate_workify_workshop();

alter table public.workshop_links enable row level security;
revoke all on public.workshop_links from anon, authenticated;
grant select, insert, update, delete on public.workshop_links to authenticated;
create policy "Owner manages private links" on public.workshop_links for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Registered attendees read eligible session links" on public.workshop_links for select to authenticated using (
  exists (select 1 from public.registrations r join public.workshops w on w.id = r.workshop_id
    where r.workshop_id = workshop_links.workshop_id and r.user_id = (select auth.uid())
    and w.status = 'open' and w.starts_at is not null and w.ends_at is not null)
);
alter table public.workshop_links add constraint workify_meet_url check (meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$') not valid;

alter table public.registrations enable row level security;
revoke all on public.registrations from anon, authenticated;
grant select, insert, delete on public.registrations to authenticated;
-- Restrictive checks remain effective alongside existing ownership/admin policies.
create policy "Registration requires an open future workshop" on public.registrations as restrictive for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.workshops w where w.id = workshop_id and w.status = 'open' and w.ends_at > now()
  ));

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
-- Existing profile ownership/admin policies and profile trigger remain intact.
-- New profile trigger code does need elevated privileges, direct RPC access does not.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
create index if not exists workify_registration_workshop_idx on public.registrations(workshop_id);
