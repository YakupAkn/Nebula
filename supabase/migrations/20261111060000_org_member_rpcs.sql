-- Uye yonetimi RPC'leri (SECURITY DEFINER, hepsi cagiran kisinin yetkisini kendi icinde kontrol eder)

-- 1) E-posta ile uye ekle: yalnizca organizasyon sahibi (owner) ekleyebilir
create or replace function public.add_org_member_by_email(org_id uuid, member_email text, member_role text default 'member')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  final_role text := case when member_role = 'owner' then 'owner' else 'member' end;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = uid and m.role = 'owner'
  ) then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select au.id into target
  from auth.users au
  where lower(au.email) = lower(trim(member_email))
  limit 1;

  if target is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = target
  ) then
    return jsonb_build_object('status', 'already_member');
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, target, final_role);

  return jsonb_build_object('status', 'added');
end;
$$;

-- 2) Uye listesi: ayni organizasyondaki herkes listeyi gorur (isim, avatar, e-posta)
create or replace function public.get_org_members(org_id uuid)
returns table (id uuid, user_id uuid, role text, full_name text, avatar_url text, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  ) then
    return;
  end if;

  return query
  select om.id, om.user_id, om.role, p.full_name, p.avatar_url, au.email::text
  from public.organization_members om
  left join public.profiles p on p.id = om.user_id
  left join auth.users au on au.id = om.user_id
  where om.organization_id = org_id
  order by om.role asc, om.created_at asc;
end;
$$;

-- 3) Uye cikar: yalnizca owner, kendini cikaramaz; projelerden de dusurur
create or replace function public.remove_org_member(member_row_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target public.organization_members;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into target from public.organization_members where id = member_row_id;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = target.organization_id and m.user_id = uid and m.role = 'owner'
  ) then
    return jsonb_build_object('status', 'forbidden');
  end if;

  if target.user_id = uid then
    return jsonb_build_object('status', 'cannot_remove_self');
  end if;

  delete from public.project_members pm
  where pm.user_id = target.user_id
    and pm.project_id in (select p.id from public.projects p where p.organization_id = target.organization_id);

  delete from public.organization_members where id = member_row_id;

  return jsonb_build_object('status', 'removed');
end;
$$;

revoke all on function public.add_org_member_by_email(uuid, text, text) from public, anon;
revoke all on function public.get_org_members(uuid) from public, anon;
revoke all on function public.remove_org_member(uuid) from public, anon;
grant execute on function public.add_org_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.get_org_members(uuid) to authenticated;
grant execute on function public.remove_org_member(uuid) to authenticated;
