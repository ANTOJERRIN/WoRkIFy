-- Prompt 12: source only. Inspect deployed schema/policy drift before applying.
-- Requires existing profiles, avatars bucket/storage policies and workify_private.
-- No profile, auth or object data is rewritten or deleted.
alter table public.profiles enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.profiles from public, anon, authenticated;
revoke update(id,email,created_at,updated_at) on public.profiles from public, anon, authenticated;
revoke select on public.profiles from public, anon;
grant select on public.profiles to authenticated;
grant update(name,handle,bio,college,location,skills,linkedin_url,x_url,website_url,avatar_url)
  on public.profiles to authenticated;
create policy "Profile updates require current owner" on public.profiles
  as restrictive for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

-- Invoker trigger; no table reads, secrets or new RPC. Existing auth bootstrap
-- may insert an empty name; valid names are required when the user edits it.
create function workify_private.validate_profile_edit()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  link text;
  skill text;
begin
  new.name := btrim(new.name);
  new.handle := nullif(lower(regexp_replace(btrim(new.handle), '^@', '')), '');
  if new.name is null or length(new.name) not between 1 and 50 then
    raise exception using errcode='23514', message='Name must contain 1 to 50 characters.';
  end if;
  if length(coalesce(new.bio,'')) > 500 or length(coalesce(new.college,'')) > 100
      or length(coalesce(new.location,'')) > 100 then
    raise exception using errcode='23514', message='Profile text exceeds its length limit.';
  end if;
  if cardinality(coalesce(new.skills,'{}')) > 10 or coalesce(array_ndims(new.skills),1) > 1 then
    raise exception using errcode='23514', message='Use up to 10 skills.';
  end if;
  foreach skill in array coalesce(new.skills,'{}') loop
    if skill is null or length(btrim(skill)) not between 1 and 30 then
      raise exception using errcode='23514', message='Skills must contain 1 to 30 characters.';
    end if;
  end loop;
  foreach link in array array[new.linkedin_url,new.x_url,new.website_url] loop
    if coalesce(link,'') <> '' and (
      length(link) > 2048 or link ~ '[[:space:]\\]' or link ~ '[[:cntrl:]]'
      or link !~ '^https://([A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?([/?#].*)?$'
    ) then
      raise exception using errcode='23514', message='Contact links must be valid HTTPS URLs without credentials.';
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function workify_private.validate_profile_edit() from public, anon, authenticated;
create trigger profiles_validate_edit before update on public.profiles
  for each row execute function workify_private.validate_profile_edit();

-- Keep intentionally public avatars public. Fail closed on unexpected setup
-- rather than silently change a private bucket's visibility or create a bucket.
do $$ begin
  if not exists(select 1 from storage.buckets where id='avatars' and public) then
    raise exception 'Expected the existing public avatars bucket; review storage configuration.';
  end if;
end $$;
update storage.buckets set file_size_limit=2097152,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'] where id='avatars';

-- Restrictive checks also protect against additional permissive storage policies.
-- Other buckets retain their existing access model. Public SELECT is unchanged.
create policy "Avatar insert owner boundary" on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'avatars' or (
    (select auth.uid()) is not null and split_part(name,'/',1)=(select auth.uid())::text
    and name ~ '^[^/]+/[A-Za-z0-9][A-Za-z0-9._-]*[.](jpg|jpeg|png|webp|gif)$'
  ));
create policy "Avatar update owner boundary" on storage.objects as restrictive for update to authenticated
  using (bucket_id <> 'avatars' or ((select auth.uid()) is not null and split_part(name,'/',1)=(select auth.uid())::text))
  with check (bucket_id <> 'avatars' or (
    (select auth.uid()) is not null and split_part(name,'/',1)=(select auth.uid())::text
    and name ~ '^[^/]+/[A-Za-z0-9][A-Za-z0-9._-]*[.](jpg|jpeg|png|webp|gif)$'
  ));
create policy "Avatar delete owner boundary" on storage.objects as restrictive for delete to authenticated
  using (bucket_id <> 'avatars' or ((select auth.uid()) is not null and split_part(name,'/',1)=(select auth.uid())::text));
