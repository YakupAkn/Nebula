-- Proje davet linkleri
--
-- Varsayımlar (mevcut şemanızla uyumlu olduğundan emin olun):
--   * public.projects(id uuid, name text, organization_id uuid)
--   * public.organizations(id uuid, name text)
--   * public.organization_members(organization_id, user_id, role)
--   * public.project_members(project_id, user_id)
--   * public.profiles(id, full_name)
-- Eğer id sütunlarınız uuid değilse aşağıdaki sütun tiplerini ona göre değiştirin.

create table if not exists public.project_invites (
  id              uuid primary key default gen_random_uuid(),
  -- 32 karakterlik rastgele hex; tahmin edilemez, URL'de güvenle taşınır
  token           text not null unique default replace(gen_random_uuid()::text, '-', ''),
  project_id      uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '7 days',
  revoked_at      timestamptz
);

create index if not exists project_invites_project_idx on public.project_invites (project_id);

alter table public.project_invites enable row level security;

-- Davet linkini yalnızca projenin organizasyonundaki üyeler oluşturabilir
create policy "org members create invites"
  on public.project_invites for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.organization_members m
      where m.organization_id = project_invites.organization_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.projects p
      where p.id = project_invites.project_id
        and p.organization_id = project_invites.organization_id
    )
  );

-- ... ve yalnızca onlar listeleyebilir
create policy "org members read invites"
  on public.project_invites for select to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = project_invites.organization_id
        and m.user_id = auth.uid()
    )
  );

-- ... ve iptal edebilir (revoked_at)
create policy "org members revoke invites"
  on public.project_invites for update to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = project_invites.organization_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = project_invites.organization_id
        and m.user_id = auth.uid()
    )
  );

-- Davet bilgisi: token bilen giriş yapmış herkes özetini görebilir.
-- Tabloya doğrudan erişemeyen davetli için SECURITY DEFINER gerekir.
create or replace function public.get_invite_info(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inv public.project_invites;
  v_project_name text;
  v_org_name text;
  v_inviter_name text;
  v_inviter_email text;
  v_already boolean;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into inv from public.project_invites where token = invite_token;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if inv.revoked_at is not null then
    return jsonb_build_object('status', 'revoked');
  end if;
  if inv.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;

  select name into v_project_name from public.projects where id = inv.project_id;
  select name into v_org_name from public.organizations where id = inv.organization_id;
  select full_name into v_inviter_name from public.profiles where id = inv.created_by;
  select email into v_inviter_email from auth.users where id = inv.created_by;
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = inv.organization_id and m.user_id = uid
  ) into v_already;

  return jsonb_build_object(
    'status', 'valid',
    'project_id', inv.project_id,
    'project_name', v_project_name,
    'organization_id', inv.organization_id,
    'organization_name', v_org_name,
    'inviter_name', coalesce(nullif(v_inviter_name, ''), split_part(v_inviter_email, '@', 1)),
    'inviter_email', v_inviter_email,
    'already_member', v_already
  );
end;
$$;

-- Daveti kabul et: organizasyona ve projeye ekler (tekrar çağrılırsa zararsız)
create or replace function public.accept_invite(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inv public.project_invites;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into inv from public.project_invites
   where token = invite_token
     and revoked_at is null
     and expires_at > now();
  if not found then
    raise exception 'invite_invalid' using errcode = 'P0001';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  select inv.organization_id, uid, 'member'
  where not exists (
    select 1 from public.organization_members m
    where m.organization_id = inv.organization_id and m.user_id = uid
  );

  insert into public.project_members (project_id, user_id)
  select inv.project_id, uid
  where not exists (
    select 1 from public.project_members pm
    where pm.project_id = inv.project_id and pm.user_id = uid
  );

  return jsonb_build_object(
    'project_id', inv.project_id,
    'organization_id', inv.organization_id
  );
end;
$$;

revoke all on function public.get_invite_info(text) from public, anon;
revoke all on function public.accept_invite(text) from public, anon;
grant execute on function public.get_invite_info(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
