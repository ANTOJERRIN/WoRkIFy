-- Run against a disposable database after applying the migrations, as postgres.
-- Fixture data and changes are rolled back. No production credentials are needed.
begin;
insert into auth.users (id, email) values
 ('22222222-2222-4222-8222-222222222222', 'owner@example.test'),
 ('33333333-3333-4333-8333-333333333333', 'other@example.test'),
 ('44444444-4444-4444-8444-444444444444', 'admin@example.test');
insert into public.admin_users values ('44444444-4444-4444-8444-444444444444');
insert into public.workshops (id, slug, title, host_name, starts_at, ends_at) values
 ('11111111-1111-4111-8111-111111111111','auth-regression','Auth regression','Test host',clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours');
insert into public.workshop_links values
 ('11111111-1111-4111-8111-111111111111','https://meet.google.com/abc-defg-hij');
-- Prompt 09 checks identity even in privileged fixture setup.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
insert into public.registrations (user_id, workshop_id) values
 ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
declare private_table text; visible_count integer;
begin
 assert exists (select 1 from public.workshops where slug = 'auth-regression'), 'Visitors must see workshops';
 foreach private_table in array array['profiles','registrations','workshop_links','admin_users','linkedin_reviews'] loop
  begin
   execute format('select count(*) from public.%I', private_table) into visible_count;
   assert visible_count = 0, 'Anonymous private data exposure: ' || private_table;
  exception when insufficient_privilege then null; -- Later stages revoke table grants too.
  end;
 end loop;
 begin
  insert into public.registrations (user_id, workshop_id) values
   ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111');
  raise exception 'Anonymous registration was allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.workshops (slug,title,host_name) values ('forbidden','Forbidden','Visitor');
  raise exception 'Anonymous hosting was allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.admin_users values ('33333333-3333-4333-8333-333333333333');
  raise exception 'Anonymous admin escalation was allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.profiles set name='forbidden';
  assert not found, 'Anonymous profile update was allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  delete from public.workshops;
  assert not found, 'Anonymous workshop deletion was allowed';
 exception when insufficient_privilege then null;
 end;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
do $$
begin
 assert not exists (select 1 from public.workshop_links), 'Unregistered user can see links';
 assert (select count(*) from public.profiles) = 1, 'User can see another profile';
 assert not public.is_admin(), 'Ordinary user became admin';
 insert into public.registrations (user_id, workshop_id) values
  ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111');
 if to_regprocedure('public.get_workshop_join_state(uuid)') is not null then
  assert not exists (select 1 from public.workshop_links where workshop_id='11111111-1111-4111-8111-111111111111'), 'Registered user bypassed the join window';
  assert public.get_workshop_join_state('11111111-1111-4111-8111-111111111111')->>'status' = 'upcoming', 'Future registration must have a safe upcoming response';
 else
  -- Earlier-stage fixtures deliberately verify their pre-10 baseline.
  assert exists (select 1 from public.workshop_links where workshop_id='11111111-1111-4111-8111-111111111111'), 'Registered user lost legacy link access';
 end if;
 delete from public.registrations where user_id=auth.uid();
 assert not exists (select 1 from public.workshop_links), 'Unregistered user retained link access';
end $$;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
do $$
begin
 assert public.is_admin(), 'Admin role broken';
 assert exists (select 1 from public.workshop_links where workshop_id='11111111-1111-4111-8111-111111111111'), 'Admin link access broken';
 update public.workshops set title='Updated by admin' where slug='auth-regression';
 assert found, 'Admin workshop update broken';
end $$;
rollback;
