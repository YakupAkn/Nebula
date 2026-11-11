"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
import { MembersSkeleton } from "@/components/ui/Skeleton";

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  email?: string | null;
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
    const { data, error } = await supabase.rpc("get_org_members", { org_id: orgId });

    if (error) {
      console.error("Üyeler yüklenirken hata oluştu:", error);
      setMembers([]);
      return;
    }

    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      role: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string | null;
    }>;

    setMembers(
      rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        email: row.email,
        profiles: { full_name: row.full_name, avatar_url: row.avatar_url },
      }))
    );
  };

  useEffect(() => {
    async function initialize() {
      try {
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
      } catch (error) {
        console.error("Üyeler başlatılırken hata oluştu:", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
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

    const { data, error: rpcError } = await supabase.rpc("add_org_member_by_email", {
      org_id: organizationId,
      member_email: newEmail.trim(),
      member_role: newRole === "owner" ? "owner" : "member",
    });

    if (rpcError || !data) {
      setStatus({ type: "error", text: "Üye eklenirken bir hata oluştu." });
      console.error(rpcError);
      return;
    }

    const addResult = (data as { status: string }).status;
    if (addResult === "not_found") {
      setStatus({ type: "not_found", text: "Bu e-posta ile kayıtlı bir kullanıcı bulunamadı." });
      return;
    }
    if (addResult === "already_member") {
      setStatus({ type: "error", text: "Bu kullanıcı zaten organizasyon üyeliğinde." });
      return;
    }
    if (addResult === "forbidden") {
      setStatus({ type: "error", text: "Üye eklemek için organizasyon sahibi olmalısınız." });
      return;
    }
    if (addResult !== "added") {
      setStatus({ type: "error", text: "Üye eklenirken bir hata oluştu." });
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

    const { data, error } = await supabase.rpc("remove_org_member", { member_row_id: memberId });
    const removeResult = (data as { status?: string } | null)?.status;

    if (error || removeResult !== "removed") {
      setStatus({
        type: "error",
        text: removeResult === "forbidden" ? "Üye çıkarmak için organizasyon sahibi olmalısınız." : "Üye çıkarılırken bir hata oluştu.",
      });
      if (error) console.error(error);
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
    return <MembersSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Yeni üye</p>
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ekip</p>
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
                            {getInitials(member.profiles?.full_name || member.email || null)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {member.profiles?.full_name || member.email || "İsimsiz kullanıcı"}
                          </p>
                          <p className="truncate text-xs text-slate-500">{member.email ?? member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${roleStyles[member.role] ?? "bg-slate-100 text-slate-700"}`}>
                          {member.role}
                        </span>
                        {member.user_id !== sessionUserId && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id, member.user_id, member.profiles?.full_name || member.email || "Kullanıcı")}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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