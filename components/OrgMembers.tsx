"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildInviteUrl } from "@/lib/hash-route";

interface OrgMembersProps {
  organizationId: string;
  /** Verilirse "Davet Linki" bölümü gösterilir */
  projectId?: string | null;
  onClose: () => void;
}

interface OrgMemberRow {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

const ROLE_LABEL: Record<string, string> = { owner: "Sahip", member: "Üye" };

export function OrgMembers({ organizationId, projectId, onClose }: OrgMembersProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found" | "already" | "forbidden" | "error">("idle");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(Boolean(projectId));
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<OrgMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(false);

  const loadMembers = async () => {
    const { data, error } = await supabase.rpc("get_org_members", { org_id: organizationId });
    if (error) {
      setMembersError(true);
    } else {
      setMembersError(false);
      setMembers((data ?? []) as OrgMemberRow[]);
    }
    setMembersLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  // Esc ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Projenin süresi dolmamış, iptal edilmemiş en son davet linkini göster
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    supabase
      .from("project_invites")
      .select("token")
      .eq("project_id", projectId)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.token) setInviteToken(data.token);
        setLinkLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const createInviteLink = async () => {
    if (!projectId) return;
    setLinkBusy(true);
    setLinkError(false);
    setCopied(false);

    // Yenilerken eski link iptal edilir
    if (inviteToken) {
      await supabase
        .from("project_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("project_id", projectId)
        .is("revoked_at", null);
    }

    const { data, error } = await supabase
      .from("project_invites")
      .insert([{ project_id: projectId, organization_id: organizationId }])
      .select("token")
      .single();

    setLinkBusy(false);
    if (error || !data) {
      setLinkError(true);
      return;
    }
    setInviteToken(data.token);
  };

  const inviteUrl = projectId && inviteToken ? buildInviteUrl(projectId, inviteToken) : "";

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano erişimi yoksa kullanıcı alanı seçip kendisi kopyalayabilir
      const input = document.getElementById("invite-link-input") as HTMLInputElement | null;
      input?.select();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    const { data, error } = await supabase.rpc("add_org_member_by_email", {
      org_id: organizationId,
      member_email: email.trim(),
      member_role: "member",
    });

    if (error || !data) {
      setStatus("error");
      return;
    }

    const result = (data as { status: string }).status;
    if (result === "not_found") {
      setStatus("not_found");
      return;
    }
    if (result === "already_member") {
      setStatus("already");
      return;
    }
    if (result === "forbidden") {
      setStatus("forbidden");
      return;
    }
    if (result !== "added") {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
    loadMembers();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-members-title"
        className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200"
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="org-members-title" className="text-lg font-bold text-slate-900">Üyeler</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <section aria-label="Organizasyon üyeleri" className="mb-5">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Organizasyon üyeleri {!membersLoading && !membersError ? `(${members.length})` : ""}
          </p>
          {membersLoading ? (
            <p className="text-xs text-slate-600" role="status">Yükleniyor...</p>
          ) : membersError ? (
            <p className="text-xs text-rose-700 font-medium">Üyeler yüklenemedi, tekrar dene.</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-slate-600">Henüz üye yok.</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {members.map((m) => {
                const label = m.full_name || m.email || "İsimsiz kullanıcı";
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-[11px] font-bold text-white"
                        >
                          {label.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                        {m.full_name && m.email && (
                          <p className="truncate text-xs text-slate-600">{m.email}</p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                      {ROLE_LABEL[m.role] ?? m.role}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form onSubmit={handleAddMember} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ekip.arkadasi@mail.com"
              autoFocus
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Eklenecek kişinin Nebula'ya bu e-posta ile en az bir kez giriş yapmış olması gerekir.
            </p>
          </div>

          {status === "not_found" && (
            <p className="text-xs text-rose-600 font-medium">
              Bu e-posta ile kayıtlı bir kullanıcı bulunamadı. Önce kişinin giriş yapması gerekiyor.
            </p>
          )}
          {status === "already" && (
            <p className="text-xs text-amber-600 font-medium">Bu kişi zaten organizasyonun üyesi.</p>
          )}
          {status === "forbidden" && (
            <p className="text-xs text-rose-600 font-medium">
              E-posta ile üye eklemek için organizasyon sahibi olmalısın. Aşağıdaki davet linkini kullanabilirsin.
            </p>
          )}
          {status === "error" && (
            <p className="text-xs text-rose-600 font-medium">Ekleme başarısız oldu, tekrar dene.</p>
          )}
          {status === "success" && (
            <p className="text-xs text-emerald-600 font-medium">Üye eklendi.</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            {status === "loading" ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>

        {projectId && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Davet Linki
            </label>
            {linkLoading ? (
              <p className="text-xs text-slate-400">Yükleniyor...</p>
            ) : inviteUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="invite-link-input"
                    readOnly
                    value={inviteUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                  >
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">Linke sahip herkes 7 gün boyunca katılabilir.</p>
                  <button
                    type="button"
                    onClick={createInviteLink}
                    disabled={linkBusy}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 disabled:opacity-50"
                  >
                    {linkBusy ? "Yenileniyor..." : "Yenile (eskisini iptal et)"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Kayıtlı olmayan kişileri de davet etmek için bir link oluştur.
                </p>
                <button
                  type="button"
                  onClick={createInviteLink}
                  disabled={linkBusy}
                  className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all border border-slate-200"
                >
                  {linkBusy ? "Oluşturuluyor..." : "Davet Linki Oluştur"}
                </button>
              </div>
            )}
            {linkError && (
              <p className="text-xs text-rose-600 font-medium mt-2">Link oluşturulamadı, tekrar dene.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}