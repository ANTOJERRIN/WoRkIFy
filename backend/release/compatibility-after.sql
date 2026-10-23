-- The canonical Meet constraint was installed by the meeting-access contract.
-- Remove only the inspected legacy constraint that incorrectly rejects clearing.
alter table public.workshop_links drop constraint workshop_links_meet_url_https_check;

-- Match the reviewed editor's optional HTTPS fields. NOT VALID preserves legacy
-- rows; new writes are constrained and the profile trigger checks each edit.
alter table public.profiles drop constraint profiles_linkedin_url_format_check;
alter table public.profiles drop constraint profiles_x_url_format_check;
alter table public.profiles drop constraint profiles_website_url_format_check;
alter table public.profiles add constraint profiles_linkedin_url_format_check check (
  linkedin_url is null or linkedin_url = '' or (
    length(linkedin_url) <= 2048 and linkedin_url !~ '[[:space:]\\]' and linkedin_url !~ '[[:cntrl:]]'
    and linkedin_url ~ '^https://([A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?([/?#].*)?$'
  )
) not valid;
alter table public.profiles add constraint profiles_x_url_format_check check (
  x_url is null or x_url = '' or (
    length(x_url) <= 2048 and x_url !~ '[[:space:]\\]' and x_url !~ '[[:cntrl:]]'
    and x_url ~ '^https://([A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?([/?#].*)?$'
  )
) not valid;
alter table public.profiles add constraint profiles_website_url_format_check check (
  website_url is null or website_url = '' or (
    length(website_url) <= 2048 and website_url !~ '[[:space:]\\]' and website_url !~ '[[:cntrl:]]'
    and website_url ~ '^https://([A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?([/?#].*)?$'
  )
) not valid;

-- Retired assessment history is read-only to browser clients, including admins.
-- No history is deleted and server-side service-role access remains unchanged.
revoke insert, update, delete, truncate, references, trigger
  on public.linkedin_reviews from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.validate_registration_workshop() from public, anon, authenticated;

-- Known Supabase default privileges can grant client EXECUTE on new functions.
-- Revoke explicitly in each contract; verify the private trigger is not an RPC.
do $$ begin
  if has_function_privilege('anon','workify_private.guard_registration_mutation()','execute')
     or has_function_privilege('authenticated','workify_private.guard_registration_mutation()','execute')
     or has_function_privilege('anon','public.get_workshop_join_state(uuid)','execute')
     or has_column_privilege('authenticated','public.profiles','email','update')
     or has_table_privilege('authenticated','public.workshops','delete')
     or has_table_privilege('authenticated','public.linkedin_reviews','delete') then
    raise exception 'Release privilege postcondition failed.';
  end if;
end $$;
notify pgrst, 'reload schema';
