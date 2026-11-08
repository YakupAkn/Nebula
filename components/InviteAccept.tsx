"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface InviteInfo {
  status: "valid" | "not_found" | "revoked" | "expired";
  project_id?: string;
  project_name?: string;
  organization_id?: string;
  organization_name?: string;
  inviter_name?: string;
  inviter_email?: string;
  already_member?: boolean;
}

interface InviteAcceptProps {
  session: Session;
  token: string;
  onAccepted: (projectId: string, organizationId: string) => void;
  onDecline: () => void;
  onSwitchAccount: () => void;
}

const INVALID_MESSAGES: Record<string, string> = {
  not_found: "Bu davet linki geçerli değil.",
  revoked: "Bu davet linki iptal edilmiş.",
  expired: "Bu davet linkinin süresi dolmuş.",
};

export function InviteAccept({ session, token, onAccepted, onDecline, onSwitchAccount }: InviteAcceptProps) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("get_invite_info", { invite_token: token }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setLoadError(true);
        return;
      }
      setInfo(data as InviteInfo);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    const { data, error } = await supabase.rpc("accept_invite", { invite_token: token });
    if (error || !data) {
      setAccepting(false);
      setAcceptError(
        error?.message?.includes("invite_invalid")
          ? "Davet artık geçerli değil. Yeni bir link iste."
          : "Davet kabul edilemedi, tekrar dene."
      );
      return;
    }
    const result = data as { project_id: string; organization_id: string };
    onAccepted(result.project_id, result.organization_id);
  };

  const invalidMessage =
    info && info.status !== "valid" ? INVALID_MESSAGES[info.status] ?? INVALID_MESSAGES.not_found : null;
  const inviter = info?.inviter_name || info?.inviter_email || "Bir ekip arkadaşın";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nebula</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">{session.user.email}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {!info && !loadError && (
            <p className="text-sm text-slate-500 text-center py-6" role="status">
              Davet yükleniyor...
            </p>
          )}

          {loadError && (
            <div className="space-y-3">
              <p className="text-sm text-rose-600 text-center font-medium">
                Davet bilgisi alınamadı. Bağlantını kontrol edip tekrar dene.
              </p>
              <button
                onClick={onDecline}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all border border-slate-200"
              >
                Geri Dön
              </button>
            </div>
          )}

          {invalidMessage && (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 text-center font-medium">{invalidMessage}</p>
              <p className="text-xs text-slate-400 text-center">
                Daveti gönderen kişiden yeni bir link istemelisin.
              </p>
              <button
                onClick={onDecline}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                Tamam
              </button>
            </div>
          )}

          {info?.status === "valid" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                <span className="font-bold text-slate-900">{inviter}</span> seni{" "}
                <span className="font-bold text-slate-900">{info.project_name}</span> projesine davet ediyor.
              </p>
              {info.organization_name && (
                <p className="text-xs text-slate-400 text-center">Organizasyon: {info.organization_name}</p>
              )}
              {info.already_member && (
                <p className="text-xs text-emerald-600 text-center font-medium">
                  Zaten bu organizasyonun üyesisin.
                </p>
              )}
              {acceptError && <p className="text-xs text-rose-600 text-center font-medium">{acceptError}</p>}

              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                {accepting ? "Katılınıyor..." : "Kabul Et"}
              </button>
              <button
                onClick={onDecline}
                disabled={accepting}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all border border-slate-200"
              >
                Şimdi Değil
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Yanlış hesap mı?{" "}
          <button onClick={onSwitchAccount} className="font-semibold text-slate-600 hover:text-slate-900 underline">
            Başka hesapla devam et
          </button>
        </p>
      </div>
    </div>
  );
}
