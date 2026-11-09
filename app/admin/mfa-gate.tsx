"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Mode = "loading" | "verify" | "enroll" | "error";

const field =
  "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-center text-lg tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

/**
 * Admin sayfası için ikinci adım (TOTP, Supabase MFA). Sunucu yalnızca aal2 oturumlarına izin verir.
 * Daha önce doğrulanmış bir faktör varsa kod ister, yoksa Google Authenticator vb. için QR ile kurulum yaptırır.
 */
export default function MfaGate() {
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (listError) {
        setError(listError.message);
        setMode("error");
        return;
      }
      const verified = data.totp[0];
      if (verified) {
        setFactorId(verified.id);
        setMode("verify");
        return;
      }
      // Yarım kalmış eski kurulumları temizle, sonra yeni faktör oluştur
      for (const f of data.all.filter((x) => x.factor_type === "totp" && x.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Nebula admin ${Date.now()}`,
      });
      if (cancelled) return;
      if (enrollError || !enrolled) {
        setError(enrollError?.message ?? "Kurulum başlatılamadı.");
        setMode("error");
        return;
      }
      setFactorId(enrolled.id);
      setQr(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
      setMode("enroll");
    })().catch(() => {
      if (!cancelled) {
        setError("Bağlantı hatası.");
        setMode("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("6 haneli kodu gir.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) {
      setBusy(false);
      setCode("");
      setError("Kod hatalı veya süresi dolmuş.");
      return;
    }
    // Oturum aal2'ye yükseldi; sayfayı yeni jetonla baştan yükle
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-7 shadow-sm text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Yönetici doğrulaması</h1>

        {mode === "loading" && <p className="text-sm text-slate-500">Yükleniyor...</p>}

        {mode === "error" && <p className="text-sm text-red-600">{error}</p>}

        {mode === "enroll" && (
          <>
            <p className="text-sm text-slate-500">
              İlk kurulum: Google Authenticator, Authy veya benzeri bir uygulamayla QR kodu tara, çıkan 6 haneli kodu gir.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="TOTP QR kodu" className="mx-auto w-44 h-44" />
            <p className="text-[11px] text-slate-400 break-all">
              Elle girmek için: <span className="font-mono">{secret}</span>
            </p>
          </>
        )}

        {mode === "verify" && <p className="text-sm text-slate-500">Doğrulama uygulamandaki 6 haneli kodu gir.</p>}

        {(mode === "verify" || mode === "enroll") && (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={field}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={submit}
              disabled={busy || code.length !== 6}
              className="w-full bg-indigo-600 text-white text-sm font-semibold rounded-xl py-2.5 disabled:opacity-50"
            >
              {busy ? "Doğrulanıyor..." : "Doğrula"}
            </button>
          </>
        )}

        <Link href="/" className="block text-xs text-slate-500 hover:text-indigo-600 font-medium">
          Nebula&apos;ya dön
        </Link>
      </div>
    </main>
  );
}
