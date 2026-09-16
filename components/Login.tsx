"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StarBackground from "./StarBackground";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginMethod, setLoginMethod] = useState<"magic" | "password">("magic");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [needsProfile, setNeedsProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          const googleName = session.user.user_metadata?.full_name;
          if (googleName) {
            await supabase.from("profiles").insert([{ id: session.user.id, full_name: googleName }]);
            window.location.reload();
          } else {
            setNeedsProfile(true);
          }
        }
      }
    };

    checkSession();
  }, []);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      window.location.reload();
    }
  };

  const handleGoogleLogin = async () => {
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !userId) return;

    setStatus("loading");
    const { error } = await supabase
      .from("profiles")
      .insert([{ id: userId, full_name: fullName.trim() }]);

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setNeedsProfile(false);
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30 select-none">
      <StarBackground />

      {/* Kart Konteyner */}
      <div className="w-full max-w-md bg-zinc-950/70 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20 relative z-10 transition-all duration-300">
        
        {needsProfile ? (
          /* Durum 1: Profil Tamamlama Ekranı */
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Profilini Tamamla</h1>
              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Ekibinle uyumlu çalışabilmek için adını ve soyadını girmelisin.
              </p>
            </div>

            <form onSubmit={handleProfileComplete} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Yakup Delil"
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all"
                />
              </div>

              {status === "error" && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl font-medium">
                  {errorMessage || "Profil kaydedilemedi."}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Kaydet ve Devam Et"
                )}
              </button>
            </form>
          </div>
        ) : status === "sent" ? (
          /* Durum 2: Magic Link Gönderildi Ekranı */
          <div className="text-center py-2 animate-in fade-in duration-300">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Giriş Bağlantısı Gönderildi</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              <span className="text-zinc-200 font-medium">{email}</span> adresine tek kullanımlık bir giriş bağlantısı ilettik.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-zinc-400 font-medium mt-6 hover:text-zinc-200 transition-colors underline underline-offset-4"
            >
              Farklı bir e-posta adresi dene
            </button>
          </div>
        ) : (
          /* Durum 3: Ana Giriş Formu (Magic Link / Şifre Tab'ları + Google OAuth) */
          <div className="animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-3 shadow-lg shadow-indigo-500/20">
                <span className="text-lg font-black text-white tracking-tighter">N</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Nebula
              </h1>
              <p className="text-zinc-400 text-xs mt-1.5 font-normal">
                Ekip görev akışını yönetmek için giriş yap.
              </p>
            </div>

            {/* Google ile Devam Et */}
            <button
              onClick={handleGoogleLogin}
              disabled={status === "loading"}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-zinc-900/80 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google ile Devam Et
            </button>

            {/* Ayraç */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800/80"></div>
              </div>
              <span className="relative bg-zinc-950/90 px-3 text-[10px] uppercase font-medium tracking-widest text-zinc-500">
                veya e-posta
              </span>
            </div>

            {/* Segmented Tab Seçici */}
            <div className="flex p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setLoginMethod("magic")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  loginMethod === "magic"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  loginMethod === "password"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Şifre ile Giriş
              </button>
            </div>

            {/* Form Alanları */}
            {loginMethod === "magic" ? (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="isim@sirket.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all"
                  />
                </div>

                {status === "error" && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl font-medium">
                    {errorMessage || "Bir hata oluştu."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Giriş Bağlantısı Gönder"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@nebula.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all"
                  />
                </div>

                {status === "error" && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl font-medium">
                    {errorMessage || "Giriş başarısız."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Şifre ile Giriş Yap"
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}