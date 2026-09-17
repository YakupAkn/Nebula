"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SettingsSkeleton } from "@/components/ui/Skeleton";

interface Organization {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  organization_id: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/");
          return;
        }

        const { data: membershipRows, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", session.user.id);

        if (membershipError) {
          throw membershipError;
        }

        const organizationIds = Array.from(
          new Set((membershipRows ?? []).map((item) => item.organization_id).filter(Boolean))
        );

        let loadedOrganizations: Organization[] = [];

        if (organizationIds.length > 0) {
          const { data: organizationData, error: organizationsError } = await supabase
            .from("organizations")
            .select("id, name")
            .in("id", organizationIds)
            .order("created_at", { ascending: true });

          if (organizationsError) {
            throw organizationsError;
          }

          loadedOrganizations = (organizationData ?? []) as Organization[];
        }

        setOrganizations(loadedOrganizations);

        const selectedOrganizationId = loadedOrganizations[0]?.id ?? null;
        setActiveOrganizationId(selectedOrganizationId);

        if (!selectedOrganizationId) {
          setProjects([]);
          setMembers([]);
          return;
        }

        const [projectResult, memberResult] = await Promise.all([
          supabase
            .from("projects")
            .select("id, name, organization_id")
            .eq("organization_id", selectedOrganizationId)
            .order("created_at", { ascending: false }),
          supabase
            .from("organization_members")
            .select("user_id, role")
            .eq("organization_id", selectedOrganizationId),
        ]);

        if (projectResult.error) {
          throw projectResult.error;
        }

        setProjects((projectResult.data ?? []) as Project[]);

        const memberUserIds = (memberResult.data ?? []).map((member) => member.user_id).filter(Boolean);

        let memberProfiles: TeamMember[] = [];
        if (memberUserIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", memberUserIds);

          if (profileError) {
            throw profileError;
          }

          const profileMap = new Map((profileData ?? []).map((profile) => [profile.id, profile]));
          const roleMap = new Map((memberResult.data ?? []).map((member) => [member.user_id, member.role]));

          memberProfiles = memberUserIds
            .map((userId) => {
              const profile = profileMap.get(userId);
              if (!profile) return null;

              return {
                id: userId,
                full_name: profile.full_name || "Kullanıcı",
                email: profile.full_name || "Kullanıcı",
                avatar_url: profile.avatar_url,
                role: roleMap.get(userId) || "member",
              } as TeamMember;
            })
            .filter(Boolean) as TeamMember[];
        }

        setMembers(memberProfiles);
      } catch (error) {
        console.error("Ayarlar yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  useEffect(() => {
    if (!activeOrganizationId || organizations.length === 0) {
      return;
    }

    const loadOrganizationDetails = async () => {
      try {
        const [projectResult, memberResult] = await Promise.all([
          supabase
            .from("projects")
            .select("id, name, organization_id")
            .eq("organization_id", activeOrganizationId)
            .order("created_at", { ascending: false }),
          supabase
            .from("organization_members")
            .select("user_id, role")
            .eq("organization_id", activeOrganizationId),
        ]);

        if (projectResult.error) throw projectResult.error;
        setProjects((projectResult.data ?? []) as Project[]);

        const memberUserIds = (memberResult.data ?? []).map((member) => member.user_id).filter(Boolean);
        let memberProfiles: TeamMember[] = [];

        if (memberUserIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", memberUserIds);

          if (profileError) throw profileError;

          const profileMap = new Map((profileData ?? []).map((profile) => [profile.id, profile]));
          const roleMap = new Map((memberResult.data ?? []).map((member) => [member.user_id, member.role]));

          memberProfiles = memberUserIds
            .map((userId) => {
              const profile = profileMap.get(userId);
              if (!profile) return null;

              return {
                id: userId,
                full_name: profile.full_name || "Kullanıcı",
                email: profile.full_name || "Kullanıcı",
                avatar_url: profile.avatar_url,
                role: roleMap.get(userId) || "member",
              } as TeamMember;
            })
            .filter(Boolean) as TeamMember[];
        }

        setMembers(memberProfiles);
      } catch (error) {
        console.error("Organizasyon detayları yüklenirken hata oluştu:", error);
      }
    };

    loadOrganizationDetails();
  }, [activeOrganizationId, organizations]);

  const activeOrganization = useMemo(
    () => organizations.find((organization) => organization.id === activeOrganizationId) ?? null,
    [organizations, activeOrganizationId]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                N
              </span>
              <span>Nebula</span>
            </Link>
            <nav className="hidden md:flex space-x-2">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">
                Projeler
              </Link>
              <Link href="/members" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">
                Üyeler
              </Link>
              <Link href="/profile" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">
                Profil
              </Link>
              <Link href="/settings" className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md">
                Ayarlar
              </Link>
            </nav>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m7.5-7.5L3 12m7.5 0h10.5" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Ayarlar</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Organizasyon ve ekip yönetimi</h1>
          </div>

          {organizations.length > 0 && (
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              <span className="font-medium">Organizasyon</span>
              <select
                value={activeOrganizationId ?? ""}
                onChange={(event) => setActiveOrganizationId(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Henüz bir organizasyona ait değilsiniz.</h2>
            <p className="mt-2 text-sm text-slate-500">Dashboard üzerinden yeni organizasyon oluşturabilir ya da davet bekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Genel</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{activeOrganization?.name ?? "Organizasyon"}</h2>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    Aktif
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Projeler</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{projects.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Üyeler</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{members.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Durum</p>
                    <p className="mt-2 text-base font-semibold text-emerald-600">Aktif</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Projeler</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Tüm projeler</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {projects.length} adet
                  </span>
                </div>

                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Bu organizasyonda hiç proje bulunmuyor.
                    </p>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                          <p className="text-xs text-slate-500">{activeOrganization?.name}</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Aktif
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Üyeler</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Ekip</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {members.length} kişi
                  </span>
                </div>

                <div className="space-y-2">
                  {members.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Bu organizasyonda üye yok.
                    </p>
                  ) : (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                            {member.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{member.full_name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          {member.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hesap</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Oturum</h3>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Oturumu Kapat
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
