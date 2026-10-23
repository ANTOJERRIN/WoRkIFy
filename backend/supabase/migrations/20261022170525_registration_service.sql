-- Prompt 09. Source only: review schema/policy drift before applying.
-- Requires the archival and lifecycle migrations. No history is rewritten.
-- Retain the existing unique(user_id, workshop_id) constraint and read policies.
alter table public.registrations enable row level security;

-- Restrictive ownership checks remain effective even if a permissive policy is
-- later added. Admin read access is unchanged; admin is not an attendee bypass.
create policy "Registration inserts require current owner"
  on public.registrations as restrictive for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Registration deletes require current owner"
  on public.registrations as restrictive for delete to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Registration identity and history are immutable"
  on public.registrations as restrictive for update to authenticated
  using (false) with check (false);
revoke insert, update, delete, truncate, references, trigger on public.registrations from public;
revoke insert, update, delete, truncate, references, trigger on public.registrations from anon;
revoke update, truncate, references, trigger on public.registrations from authenticated;
grant select, insert, delete on public.registrations to authenticated;

-- This private trigger needs definer rights solely to lock a workshop row:
-- attendees cannot UPDATE workshops or take row locks under its admin RLS.
-- It returns no workshop data, is not an RPC, and validates auth.uid itself.
create function workify_private.guard_registration_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  attendee uuid := auth.uid();
  target public.workshops%rowtype;
  owner_id uuid;
  workshop_id uuid;
  checked_at timestamptz;
begin
  if tg_op = 'DELETE' then
    owner_id := old.user_id;
    workshop_id := old.workshop_id;
  else
    owner_id := new.user_id;
    workshop_id := new.workshop_id;
  end if;
  if attendee is null or attendee is distinct from owner_id then
    raise exception using errcode = '42501', message = 'Sign in to manage your own registration.';
  end if;

  -- SHARE conflicts with schedule/status UPDATEs, while allowing parallel
  -- registrations. Recheck with the server clock AFTER any row-lock wait.
  select w.* into target from public.workshops w where w.id = workshop_id for share;
  checked_at := clock_timestamp();
  if not found or not workify_private.workshop_registration_eligible(
      target.status, target.starts_at, target.ends_at, checked_at) then
    raise exception using errcode = 'P0001',
      message = 'Registration and cancellation are available only for open workshops before they start.';
  end if;
  if tg_op = 'INSERT' then
    new.created_at := checked_at;
    return new;
  end if;
  return old;
end;
$$;
revoke all on function workify_private.guard_registration_mutation() from public, anon, authenticated;
create trigger registrations_lifecycle_guard
  before insert or delete on public.registrations
  for each row execute function workify_private.guard_registration_mutation();

-- No UPDATE policy is installed. Cancellation removes only an eligible future
-- reservation. Ongoing/completed/cancelled/archived records cannot be deleted
-- by this path. Attendance/reviews are separate facts and are never mutated.
