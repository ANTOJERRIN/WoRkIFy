-- Prompt 10 source only. Review drift and apply 03/08/09 first.
create function workify_private.meeting_access_now()
returns timestamptz language sql volatile security invoker set search_path = '' as $$
  select clock_timestamp();
$$;
revoke all on function workify_private.meeting_access_now() from public, anon, authenticated;
grant usage on schema workify_private to anon, authenticated;
grant execute on function workify_private.meeting_access_now() to anon, authenticated;
alter table public.workshop_links enable row level security;
alter table public.workshop_links add constraint workshop_links_google_meet_url_check
  check (meet_url = '' or meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$') not valid;
-- Legacy rows stay intact; unsafe descriptions are hidden until corrected.
alter table public.workshops add constraint workshops_public_descriptions_check
  check (concat_ws(' ',slug,title,host_name,mode,timezone,short_description,full_description,array_to_string(tags,' '))
    !~* 'meet[.]google[.]com') not valid;
create policy "Public descriptions exclude meeting addresses"
  on public.workshops as restrictive for select to anon, authenticated
  using (concat_ws(' ',slug,title,host_name,mode,timezone,short_description,full_description,array_to_string(tags,' '))
    !~* 'meet[.]google[.]com');

-- Restrictive veto alongside existing owner/admin policies. Admin management
-- may read active publications outside the join window; cancelled/archived
-- publications veto every client read, including admins.
create policy "Meeting reads require eligible attendee or active admin management"
  on public.workshop_links as restrictive for select to anon, authenticated
  using (
    (select auth.uid()) is not null
    and (meet_url = '' or meet_url ~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$')
    and exists (select 1 from public.workshops w where w.id = workshop_links.workshop_id
      and w.status in ('open','coming_soon')
      and ((select public.is_admin()) or (
        w.status = 'open' and w.starts_at is not null and w.ends_at is not null
        and isfinite(w.starts_at) and isfinite(w.ends_at) and w.ends_at > w.starts_at
        and workify_private.meeting_access_now() >= w.starts_at - interval '15 minutes'
        and workify_private.meeting_access_now() < w.ends_at
        and exists (select 1 from public.registrations r
          where r.workshop_id = w.id and r.user_id = (select auth.uid()))
      ))
    )
  );
create policy "Meeting inserts require active publication"
  on public.workshop_links as restrictive for insert to authenticated
  with check (exists (select 1 from public.workshops w where w.id = workshop_links.workshop_id
    and w.status in ('open','coming_soon')));
create policy "Meeting updates require active publication"
  on public.workshop_links as restrictive for update to authenticated
  using (exists (select 1 from public.workshops w where w.id = workshop_links.workshop_id
    and w.status in ('open','coming_soon')))
  with check (exists (select 1 from public.workshops w where w.id = workshop_links.workshop_id
    and w.status in ('open','coming_soon')));

-- Pure predicates read no data. Their supplied test clock is never authority
-- for a public endpoint. The trigger and other private functions stay revoked.
grant usage on schema workify_private to authenticated;
grant execute on function workify_private.workshop_schedule_valid(timestamptz,timestamptz) to authenticated;
grant execute on function workify_private.workshop_join_eligible(text,timestamptz,timestamptz,timestamptz) to authenticated;

create function public.get_workshop_join_state(p_workshop_id uuid)
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  attendee uuid := auth.uid();
  target public.workshops%rowtype;
  checked_at timestamptz;
  link text;
  refresh_ms integer;
begin
  if attendee is null then return jsonb_build_object('status','unauthorized'); end if;
  if not exists (select 1 from public.registrations r
    where r.workshop_id = p_workshop_id and r.user_id = attendee) then
    return jsonb_build_object('status','unauthorized');
  end if;
  select w.* into target from public.workshops w where w.id = p_workshop_id;
  if not found then return jsonb_build_object('status','unavailable'); end if;
  checked_at := workify_private.meeting_access_now();
  if target.status not in ('open','coming_soon') or not workify_private.workshop_schedule_valid(target.starts_at,target.ends_at) then
    return jsonb_build_object('status','unavailable');
  end if;
  if checked_at >= target.ends_at then return jsonb_build_object('status','ended'); end if;
  if target.status <> 'open' then return jsonb_build_object('status','unavailable'); end if;
  if checked_at < target.starts_at - interval '15 minutes' then
    refresh_ms := greatest(1,least(30000,floor(extract(epoch from (target.starts_at - interval '15 minutes' - checked_at))*1000)))::integer;
    return jsonb_build_object('status','upcoming','refresh_after_ms',refresh_ms);
  end if;
  select l.meet_url into link from public.workshop_links l where l.workshop_id = p_workshop_id;
  -- RLS may deny a changed schedule/status. Recheck end after the read, too.
  checked_at := workify_private.meeting_access_now();
  if checked_at >= target.ends_at then return jsonb_build_object('status','ended'); end if;
  refresh_ms := greatest(1,least(30000,floor(extract(epoch from (target.ends_at-checked_at))*1000)))::integer;
  if not workify_private.workshop_join_eligible(target.status,target.starts_at,target.ends_at,checked_at)
    or link is null or link !~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$' then
    return jsonb_build_object('status','unavailable','refresh_after_ms',refresh_ms);
  end if;
  return jsonb_build_object('status','joinable','meet_url',link,'refresh_after_ms',refresh_ms);
end;
$$;
revoke all on function public.get_workshop_join_state(uuid) from public, anon, authenticated;
grant execute on function public.get_workshop_join_state(uuid) to authenticated;
