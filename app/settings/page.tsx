"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
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

interface OrganizationMemberRow {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  const loadMembers = useCallback(async (organizationId: string) => {
    const { data, error } = await supabase.rpc("get_org_members", { org_id: organizationId });
    if (error) throw error;

    return ((data ?? []) as OrganizationMemberRow[]).map((member) => ({
      id: member.user_id,
      full_name: member.full_name || member.email || "Kullanıcı",
      email: member.email || "E-posta bilgisi yok",
      avatar_url: member.avatar_url,
      role: member.role,
    }));
  }, []);

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

        const [projectResult, memberProfiles] = await Promise.all([
          supabase
            .from("projects")
            .select("id, name, organization_id")
            .eq("organization_id", selectedOrganizationId)
            .order("created_at", { ascending: false }),
          loadMembers(selectedOrganizationId),
        ]);

        if (projectResult.error) {
          throw projectResult.error;
        }

        setProjects((projectResult.data ?? []) as Project[]);
        setMembers(memberProfiles);
      } catch (error) {
        console.error("Ayarlar yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [loadMembers, router]);

  useEffect(() => {
    if (!activeOrganizationId || organizations.length === 0) {
      return;
    }

    const loadOrganizationDetails = async () => {
      try {
        const [projectResult, memberProfiles] = await Promise.all([
          supabase
            .from("projects")
            .select("id, name, organization_id")
            .eq("organization_id", activeOrganizationId)
            .order("created_at", { ascending: false }),
          loadMembers(activeOrganizationId),
        ]);

        if (projectResult.error) throw projectResult.error;
        setProjects((projectResult.data ?? []) as Project[]);
        setMembers(memberProfiles);
      } catch (error) {
        console.error("Organizasyon detayları yüklenirken hata oluştu:", error);
      }
    };

    loadOrganizationDetails();
  }, [activeOrganizationId, loadMembers, organizations]);

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
      <AppHeader />

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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Genel</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{activeOrganization?.name ?? "Organizasyon"}</h2>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    Aktif
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Projeler</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{projects.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Üyeler</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{members.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Durum</p>
                    <p className="mt-2 text-base font-semibold text-emerald-600">Aktif</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Projeler</p>
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
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Üyeler</p>
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
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={`${member.full_name} profil fotoğrafı`}
                              className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                            />
                          ) : (
                            <div aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                              {member.full_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{member.full_name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                          {member.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Hesap</p>
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
