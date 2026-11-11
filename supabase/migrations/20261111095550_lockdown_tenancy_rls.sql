-- Coklu kiraci (multi-tenant) RLS sikilastirmasi
-- Sorun: organizations / organization_members / projects / project_members uzerinde
-- kosulsuz (true) INSERT ve SELECT politikalari vardi. Politikalar OR ile birlestigi icin
-- giris yapan herkes baska organizasyona owner olarak girebiliyor, projeleri ve gorevleri okuyabiliyordu.

create or replace function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clean text := trim(org_name);
  new_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if clean is null or char_length(clean) < 1 or char_length(clean) > 100 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  insert into public.organizations (name, created_by) values (clean, uid) returning id into new_id;
  insert into public.organization_members (organization_id, user_id, role) values (new_id, uid, 'owner');
  return new_id;
end;
$$;

revoke all on function public.create_organization(text) from public, anon;
grant execute on function public.create_organization(text) to authenticated;

drop policy if exists "org_insert" on public.organizations;
drop policy if exists "org_select" on public.organizations;

drop policy if exists "Kullanıcılar üyeliği oluşturabilir" on public.organization_members;
drop policy if exists "org_members_insert" on public.organization_members;
drop policy if exists "Kullanıcılar üyeleri görebilir" on public.organization_members;
drop policy if exists "org_members_select" on public.organization_members;

drop policy if exists "proj_select" on public.projects;
drop policy if exists "proj_insert" on public.projects;
drop policy if exists "projects_select" on public.projects;

drop policy if exists "proj_members_select" on public.project_members;
drop policy if exists "proj_members_insert" on public.project_members;
drop policy if exists "project_members_select" on public.project_members;
drop policy if exists "project_members_insert" on public.project_members;

create policy "organizations_select_own_orgs"
  on public.organizations for select to authenticated
  using (id in (select public.get_my_organization_ids()));

create policy "organization_members_select_own_orgs"
  on public.organization_members for select to authenticated
  using (organization_id in (select public.get_my_organization_ids()));

create policy "projects_select_own_orgs"
  on public.projects for select to authenticated
  using (organization_id in (select public.get_my_organization_ids()));

create policy "project_members_select_own_orgs"
  on public.project_members for select to authenticated
  using (
    project_id in (
      select p.id from public.projects p
      where p.organization_id in (select public.get_my_organization_ids())
    )
  );

create policy "project_members_insert_same_org"
  on public.project_members for insert to authenticated
  with check (
    exists (
      select 1
      from public.projects p
      join public.organization_members me
        on me.organization_id = p.organization_id and me.user_id = auth.uid()
      join public.organization_members tgt
        on tgt.organization_id = p.organization_id and tgt.user_id = project_members.user_id
      where p.id = project_members.project_id
    )
  );
