-- Public workshop descriptions are separate from protected workshop_links.
-- Preserve authenticated access and every existing write/ownership policy.
grant select on public.workshops to anon;

create policy "Visitors can read workshops"
  on public.workshops for select
  to anon
  using (true);
