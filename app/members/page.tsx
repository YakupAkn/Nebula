"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error" | "not_found"; text: string }>({
    type: "idle",
    text: "",
  });

  const fetchMembers = async (orgId: string) => {
    const { data, error } = await supabase
      .from("organization_members")
      .select("id, user_id, role, profiles:user_id(full_name, avatar_url)")
      .eq("organization_id", orgId)
      .order("role", { ascending: true });

    if (error) {
      console.error("Üyeler yüklenirken hata oluştu:", error);
      setMembers([]);
      return;
    }

    const normalizedMembers = ((data ?? []) as Array<{
      id: string;
      user_id: string;
      role: string;
      profiles?: Array<{ full_name: string | null; avatar_url: string | null }> | { full_name: string | null; avatar_url: string | null } | null;
    }>).map((member) => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;

      return {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        profiles: profile ?? null,
      } satisfies MemberRow;
    });

    setMembers(normalizedMembers);
  };

  useEffect(() => {
    async function initialize() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/");
        return;
      }

      setSessionUserId(session.user.id);

      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      const orgId = data?.organization_id ?? null;
      setOrganizationId(orgId);

      if (orgId) {
        await fetchMembers(orgId);
      }

      setLoading(false);
    }

    initialize();
  }, [router]);

  useEffect(() => {
    if (!organizationId) return;
    fetchMembers(organizationId);
  }, [organizationId]);

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!organizationId || !newEmail.trim()) {
      setStatus({ type: "error", text: "Lütfen geçerli bir e-posta adresi girin." });
      return;
    }

    const { data: users, error: searchError } = await supabase.rpc("find_user_by_email", {
      search_email: newEmail.trim(),
    });

    if (searchError || !users || users.length === 0) {
      setStatus({ type: "not_found", text: "Bu e-posta ile kayıtlı bir kullanıcı bulunamadı." });
      return;
    }

    const foundUser = users[0];

    if (members.some((member) => member.user_id === foundUser.id)) {
      setStatus({ type: "error", text: "Bu kullanıcı zaten organizasyon üyeliğinde." });
      return;
    }

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert([
        {
          organization_id: organizationId,
          user_id: foundUser.id,
          role: newRole,
        },
      ]);

    if (insertError) {
      setStatus({ type: "error", text: "Üye eklenirken bir hata oluştu." });
      console.error(insertError);
      return;
    }

    setNewEmail("");
    setNewRole("member");
    setStatus({ type: "success", text: "Üye başarıyla eklendi." });
    fetchMembers(organizationId);
  };

  const handleRemoveMember = async (memberId: string, userId: string, name: string) => {
    if (userId === sessionUserId) {
      setStatus({ type: "error", text: "Kendi üyeliğinizi çıkaramazsınız." });
      return;
    }

    const confirmed = window.confirm(`${name} isimli üyeyi organizasyondan çıkarmak istediğinize emin misiniz?`);
    if (!confirmed) return;

    const { error } = await supabase.from("organization_members").delete().eq("id", memberId);

    if (error) {
      setStatus({ type: "error", text: "Üye çıkarılırken bir hata oluştu." });
      console.error(error);
      return;
    }

    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setStatus({ type: "success", text: "Üye organizasyondan çıkarıldı." });
  };

  const getInitials = (fullName: string | null) => {
    if (!fullName || !fullName.trim()) return "U";
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const roleStyles: Record<string, string> = {
    owner: "bg-violet-100 text-violet-700",
    admin: "bg-indigo-100 text-indigo-700",
    member: "bg-slate-100 text-slate-700",
    viewer: "bg-amber-100 text-amber-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-slate-500">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium">Üyeler yükleniyor...</span>
        </div>
      </div>
    );
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
              <Link href="/members" className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md">
                Üyeler
              </Link>
              <Link href="/profile" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">
                Profil
              </Link>
              <Link href="/settings" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">
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
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Takım</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Üyeler</h1>
          <p className="text-sm text-slate-500 mt-1">Organizasyon üyelerini görüntüleyin ve yeni ekip arkadaşları ekleyin.</p>
        </div>

        {status.type !== "idle" && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status.type === "not_found"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.text}
          </div>
        )}

        {!organizationId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Henüz bir organizasyona ait değilsiniz.</h2>
            <p className="mt-2 text-sm text-slate-500">Dashboard üzerinden ilk organizasyonunuzu oluşturup sonra üyeleri yönetebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Yeni üye</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Ekip ekle</h2>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label htmlFor="member-email" className="mb-2 block text-sm font-medium text-slate-700">
                    E-posta adresi
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="ekip@firma.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="member-role" className="mb-2 block text-sm font-medium text-slate-700">
                    Rol
                  </label>
                  <select
                    id="member-role"
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Üye Ekle
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ekip</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Mevcut üyeler</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {members.length} kişi
                </span>
              </div>

              {members.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Bu organizasyonda henüz üye yok.
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {member.profiles?.avatar_url ? (
                          <img
                            src={member.profiles.avatar_url}
                            alt={member.profiles?.full_name || "Üye"}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                            {getInitials(member.profiles?.full_name ?? null)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {member.profiles?.full_name || "İsimsiz kullanıcı"}
                          </p>
                          <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${roleStyles[member.role] ?? "bg-slate-100 text-slate-700"}`}>
                          {member.role}
                        </span>
                        {member.user_id !== sessionUserId && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id, member.user_id, member.profiles?.full_name || "Kullanıcı")}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Çıkar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}