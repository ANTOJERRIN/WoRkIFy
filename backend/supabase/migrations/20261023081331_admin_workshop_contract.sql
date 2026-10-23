-- Prompt 13: unapplied source. Review live schema/history/column grants first.
-- Requires prior lifecycle, registration and meeting access contracts.
alter table public.workshops enable row level security;
alter table public.workshop_links enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.workshops from public, anon, authenticated;
revoke update(id,created_at,updated_at) on public.workshops from public, anon, authenticated;
grant insert(slug,title,host_name,mode,status,short_description,full_description,tags,starts_at,ends_at,timezone),
  update(slug,title,host_name,mode,status,short_description,full_description,tags,starts_at,ends_at,timezone)
  on public.workshops to authenticated;
create policy "Workshop inserts require authoritative admin" on public.workshops as restrictive
  for insert to authenticated with check ((select auth.uid()) is not null and (select public.is_admin()));
create policy "Workshop updates require authoritative admin" on public.workshops as restrictive
  for update to authenticated using ((select auth.uid()) is not null and (select public.is_admin()))
  with check ((select auth.uid()) is not null and (select public.is_admin()));

revoke insert, update, delete, truncate, references, trigger on public.workshop_links from public, anon, authenticated;
-- PostgREST upsert includes its conflict key in the UPDATE projection, so grant
-- that column while the trigger below forbids actually changing its identity.
grant insert(workshop_id,meet_url), update(workshop_id,meet_url) on public.workshop_links to authenticated;
create policy "Meeting inserts require authoritative admin" on public.workshop_links as restrictive
  for insert to authenticated with check ((select auth.uid()) is not null and (select public.is_admin()));
create policy "Meeting updates require authoritative admin" on public.workshop_links as restrictive
  for update to authenticated using ((select auth.uid()) is not null and (select public.is_admin()))
  with check ((select auth.uid()) is not null and (select public.is_admin()));

-- Clients cannot edit membership or hard-delete a workshop/history chain.
revoke insert, update, delete, truncate, references, trigger on public.admin_users from public, anon, authenticated;

-- Invoker trigger: validation only, never an authorization RPC or definer bypass.
create function workify_private.validate_admin_workshop()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare tag text;
begin
  if new.id='be33c1fc-e4c4-4def-b33e-078fdf662400'::uuid and new.status <> 'archived' then
    raise exception using errcode='23514',message='The retired workshop must remain archived.';
  end if;
  -- Status-only closure preserves legacy metadata and registration history.
  -- Existing schedule/description constraints still independently apply.
  if tg_op='UPDATE' and new.status in ('cancelled','archived')
     and (to_jsonb(new)-'status'-'updated_at') = (to_jsonb(old)-'status'-'updated_at') then
    return new;
  end if;
  new.slug := lower(btrim(new.slug)); new.title := btrim(new.title); new.host_name := btrim(new.host_name);
  new.timezone := btrim(new.timezone);
  if new.slug is null or length(new.slug) not between 3 and 80 or new.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using errcode='23514',message='Use a 3 to 80 character lowercase slug with single hyphens.';
  end if;
  if new.title is null or length(new.title) not between 1 and 160 or new.host_name is null or length(new.host_name) not between 1 and 100 then
    raise exception using errcode='23514',message='Title and host are required within their length limits.';
  end if;
  if length(coalesce(new.short_description,'')) > 500 or length(coalesce(new.full_description,'')) > 12000 then
    raise exception using errcode='23514',message='Description length exceeds the limit.';
  end if;
  if cardinality(coalesce(new.tags,'{}')) > 10 or coalesce(array_ndims(new.tags),1) > 1 then
    raise exception using errcode='23514',message='Use up to 10 tags.';
  end if;
  foreach tag in array coalesce(new.tags,'{}') loop
    if tag is null or length(btrim(tag)) not between 1 and 40 then
      raise exception using errcode='23514',message='Tags must contain 1 to 40 characters.';
    end if;
  end loop;
  if new.timezone is null or length(new.timezone) > 100 or not exists (
    select 1 from pg_catalog.pg_timezone_names where lower(name)=lower(new.timezone)
  ) then
    raise exception using errcode='23514',message='Provide a valid display timezone.';
  end if;
  if new.mode is distinct from 'Online — Google Meet' then
    raise exception using errcode='23514',message='Unsupported workshop mode.';
  end if;
  return new;
end;
$$;
revoke all on function workify_private.validate_admin_workshop() from public, anon, authenticated;
create trigger workshops_validate_admin before insert or update on public.workshops
  for each row execute function workify_private.validate_admin_workshop();

create function workify_private.keep_meeting_identity()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.workshop_id is distinct from old.workshop_id then
    raise exception using errcode='23514',message='Meeting workshop identity cannot be changed.';
  end if;
  return new;
end;
$$;
revoke all on function workify_private.keep_meeting_identity() from public, anon, authenticated;
create trigger workshop_links_keep_identity before update on public.workshop_links
  for each row execute function workify_private.keep_meeting_identity();
