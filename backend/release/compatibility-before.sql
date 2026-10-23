-- Keep the inspected, authoritative membership helper private. Existing policies
-- already use it; the assembled contracts use it instead of public.is_admin().
grant usage on schema private to authenticated;
alter function private.is_admin() set search_path = '';
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
