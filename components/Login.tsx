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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30">
      <StarBackground />

      <div className="w-full max-w-md bg-[#0d0d12]/60 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {needsProfile ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Profilini Tamamla</h1>
              <p className="text-zinc-400 text-xs mt-1.5">Sistemde ekibinle uyumlu çalışabilmek için adını soyadını girmelisin.</p>
            </div>

            <form onSubmit={handleProfileComplete} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Yakup Delil"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">
                  {errorMessage || "Profil kaydedilemedi."}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
              >
                Kaydet ve Devam Et
              </button>
            </form>
          </div>
        ) : status === "sent" ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Giriş bağlantısı gönderildi</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              <span className="text-zinc-200 font-medium">{email}</span> adresine bir bağlantı ilettik.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-zinc-500 font-medium mt-6 hover:text-zinc-300 transition-colors underline underline-offset-4"
            >
              Farklı bir e-posta dene
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-400">
                Nebula
              </h1>
              <p className="text-zinc-400 text-xs mt-2 font-normal">
                Ekip görev akışını yönetmek için giriş yap.
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={status === "loading"}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google ile Devam Et
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800/80"></div>
              </div>
              <span className="relative bg-[#0d0d12] px-3 text-[10px] uppercase font-medium tracking-widest text-zinc-500">
                veya e-posta
              </span>
            </div>

            {/* Giriş Yöntemi Seçici Sekmeler */}
            <div className="flex border-b border-zinc-800 mb-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLoginMethod("magic")}
                className={`flex-1 pb-2 text-center border-b-2 transition-colors ${loginMethod === "magic" ? "border-zinc-200 text-zinc-200" : "border-transparent text-zinc-500"}`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`flex-1 pb-2 text-center border-b-2 transition-colors ${loginMethod === "password" ? "border-zinc-200 text-zinc-200" : "border-transparent text-zinc-500"}`}
              >
                Şifre (Hızlı Test)
              </button>
            </div>

            {loginMethod === "magic" ? (
              /* Magic Link Formu */
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="isim@sirket.com"
                    className="w-full px-4 py-2.5 text-sm bg-zinc-950/40 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">
                    {errorMessage || "Bir hata oluştu."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
                >
                  {status === "loading" ? "Gönderiliyor..." : "Giriş Bağlantısı Gönder"}
                </button>
              </form>
            ) : (
              /* Hızlı Test Şifre Formu */
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@nebula.com"
                    className="w-full px-4 py-2.5 text-sm bg-zinc-950/40 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-sm bg-zinc-950/40 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">
                    {errorMessage || "Giriş başarısız."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
                >
                  {status === "loading" ? "Giriş Yapılıyor..." : "Şifre ile Giriş Yap"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}