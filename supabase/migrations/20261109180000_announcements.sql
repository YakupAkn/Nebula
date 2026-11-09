-- Nebula duyuru sistemi: profil sütunları, profiles kilitleme, announcements tablosu
-- (Supabase'e "announcements_admin_and_profile_lockdown" adıyla uygulandı)

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists beta_tester boolean not null default false;

create index if not exists profiles_marketing_consent_idx
  on public.profiles (id) where marketing_consent = true;

-- profiles_own politikası ALL olduğu için yetkileri sütun bazında daralt (is_admin / beta_tester kullanıcıya kapalı)
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant insert (
  id, full_name, avatar_url, created_at, team_size, referral_source,
  onboarding_completed, occupation, team_focus, terms_accepted_at,
  terms_version, marketing_consent, marketing_consent_at
) on table public.profiles to authenticated;
grant update (
  id, full_name, avatar_url, team_size, referral_source,
  onboarding_completed, occupation, team_focus, terms_accepted_at,
  terms_version, marketing_consent, marketing_consent_at
) on table public.profiles to authenticated;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  audience text not null check (audience in ('all', 'beta', 'selected', 'test')),
  sent_by uuid references auth.users (id) on delete set null,
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  failures jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
revoke all on table public.announcements from anon, authenticated;
create index if not exists announcements_created_at_idx on public.announcements (created_at desc);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
