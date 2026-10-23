-- Version assigned by Supabase apply_migration; already applied in production.
-- Older deployed clients do not filter archived records themselves.
-- Preserve authenticated historical access while excluding retired public cards.
alter policy "Visitors can read workshops" on public.workshops
  using (status <> 'archived');
