-- Proje karti ozeti: uye sayisi ve acik gorev sayisi.
-- SECURITY INVOKER: mevcut RLS politikalari aynen gecerli, ek yetki vermez.
create or replace function public.get_project_stats(org_id uuid)
returns table (project_id uuid, member_count bigint, open_task_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    (select count(*) from public.project_members pm where pm.project_id = p.id),
    (select count(*) from public.tasks t where t.project_id = p.id and t.status <> 'Tamamlananlar')
  from public.projects p
  where p.organization_id = org_id;
$$;

revoke all on function public.get_project_stats(uuid) from public, anon;
grant execute on function public.get_project_stats(uuid) to authenticated;
