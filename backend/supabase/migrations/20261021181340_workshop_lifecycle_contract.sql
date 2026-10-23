-- Prompt 08: compatible publication/schedule contract. No data is rewritten.
-- Apply only after drift review and the existing public/archival migrations.
-- Registration/link authorization policies belong to prompts 09 and 10.

alter table public.workshops add constraint workshops_lifecycle_schedule_check
check (
  status in ('cancelled', 'archived')
  or (status = 'coming_soon' and starts_at is null and ends_at is null)
  or (starts_at is not null and ends_at is not null
      and isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at)
) not valid;

-- NOT VALID preserves legacy rows, while checking new rows and later updates.
-- Validate separately after existing inconsistencies have been reviewed.
-- Pure, invoker-rights predicates for the next two services; no public RPC,
-- data reads, grants, policies, security-definer code or caller-supplied clock
-- is installed as an authorization path here.
create schema if not exists workify_private;

create function workify_private.workshop_schedule_valid(start_time timestamptz, end_time timestamptz)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select coalesce(start_time is not null and end_time is not null
    and isfinite(start_time) and isfinite(end_time) and end_time > start_time, false);
$$;

create function workify_private.workshop_lifecycle_state(publication text, start_time timestamptz, end_time timestamptz, at_time timestamptz)
returns text language sql immutable security invoker set search_path = '' as $$
  select case
    when publication in ('archived', 'cancelled') then publication
    when publication is null or publication not in ('open', 'coming_soon')
      or at_time is null or not isfinite(at_time) then 'unavailable'
    when publication = 'coming_soon' and start_time is null and end_time is null then 'unscheduled'
    when not workify_private.workshop_schedule_valid(start_time, end_time) then 'unavailable'
    when at_time >= end_time then 'completed'
    when publication = 'coming_soon' then 'coming-soon'
    when at_time >= start_time then 'ongoing'
    else 'scheduled'
  end;
$$;

create function workify_private.workshop_registration_eligible(publication text, start_time timestamptz, end_time timestamptz, at_time timestamptz)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select workify_private.workshop_lifecycle_state(publication, start_time, end_time, at_time) = 'scheduled';
$$;

create function workify_private.workshop_join_eligible(publication text, start_time timestamptz, end_time timestamptz, at_time timestamptz)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select coalesce(publication = 'open' and workify_private.workshop_schedule_valid(start_time, end_time)
    and at_time is not null and isfinite(at_time)
    and at_time >= start_time - interval '15 minutes' and at_time < end_time, false);
$$;

revoke all on function workify_private.workshop_schedule_valid(timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function workify_private.workshop_lifecycle_state(text,timestamptz,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function workify_private.workshop_registration_eligible(text,timestamptz,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function workify_private.workshop_join_eligible(text,timestamptz,timestamptz,timestamptz) from public, anon, authenticated;
