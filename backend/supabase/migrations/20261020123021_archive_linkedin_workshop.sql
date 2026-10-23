-- Add one durable publication state. Stage 08 will extend this same contract.
-- Existing open/coming_soon/cancelled rows remain compatible.
alter table public.workshops drop constraint workshops_status_check;
alter table public.workshops add constraint workshops_status_check
  check (status in ('open', 'coming_soon', 'cancelled', 'archived'));

-- Verified against project epgsgvwdlwarktbjrdfn on 20 October 2026.
-- Never archive records based only on a title/slug match. On another database
-- where this exact record is absent, leave its data alone; do not create a row.
do $$
declare target public.workshops%rowtype;
begin
  select * into target from public.workshops
    where id = 'be33c1fc-e4c4-4def-b33e-078fdf662400' for update;
  if not found then
    raise notice 'Verified LinkedIn workshop ID is absent; no workshop archived.';
    return;
  end if;
  if target.slug is distinct from 'linkedin-workshop'
     or target.title is distinct from 'LinkedIn Workshop'
     or target.host_name is distinct from 'F1 Forge'
     or target.starts_at is distinct from timestamptz '2026-10-02 14:00:00+00'
     or target.ends_at is distinct from timestamptz '2026-10-02 15:00:00+00' then
    raise exception 'LinkedIn workshop identity mismatch; review metadata before archiving.';
  end if;
  update public.workshops set status = 'archived' where id = target.id;
end;
$$;

-- Restrictive policies add only an archival veto alongside existing ownership
-- and admin policies. They grant no new access and preserve all historical rows.
create policy "Archived workshops reject new registrations"
  on public.registrations as restrictive for insert to authenticated
  with check (exists (
    select 1 from public.workshops w
    where w.id = registrations.workshop_id and w.status <> 'archived'
  ));

create policy "Archived workshops hide meeting links"
  on public.workshop_links as restrictive for select to authenticated
  using (exists (
    select 1 from public.workshops w
    where w.id = workshop_links.workshop_id and w.status <> 'archived'
  ));
