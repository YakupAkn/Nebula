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

export function OrgMembers({ organizationId, projectId, onClose }: OrgMembersProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found" | "error">("idle");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(Boolean(projectId));
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [copied, setCopied] = useState(false);

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

    const { data: users, error: searchError } = await supabase.rpc("find_user_by_email", {
      search_email: email.trim(),
    });

    if (searchError || !users || users.length === 0) {
      setStatus("not_found");
      return;
    }

    const foundUser = users[0];

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert([{ organization_id: organizationId, user_id: foundUser.id, role: "member" }]);

    if (insertError) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-slate-900">Üye Ekle</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
          {status === "error" && (
            <p className="text-xs text-rose-600 font-medium">
              Ekleme başarısız oldu — zaten üye olabilir.
            </p>
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