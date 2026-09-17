"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProfileSkeleton } from "@/components/ui/Skeleton";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.push("/");
          return;
        }

        const user = session.user;
        setEmail(user.email ?? "");
        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profil alınamadı:", profileError.message);
        }

        if (profile) {
          const typedProfile = profile as UserProfile;
          setFullName(typedProfile.full_name ?? "");
          setAvatarUrl(typedProfile.avatar_url ?? null);
        }
      } catch (err) {
        console.error("Yükleme hatası:", err);
        setMessage({ type: "error", text: "Profil bilgileri yüklenirken bir sorun oluştu." });
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName.trim() || email.split("@")[0],
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      setMessage({ type: "success", text: "Profiliniz başarıyla güncellendi." });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Güncelleme sırasında bir hata oluştu.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string, mail: string) => {
    if (name.trim()) {
      return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return mail.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
              <Link href="/profile" className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Hesap</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Profil</h1>
          <p className="text-sm text-slate-500 mt-1">Kişisel bilgilerinizi Supabase profil kaydınızdan yönetebilirsiniz.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || "Kullanıcı"}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {getInitials(fullName, email)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{fullName || "Kullanıcı"}</h3>
                <p className="text-sm text-slate-500">{email || "E-posta bilinmiyor"}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Ad Soyad
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız ve soyadınız"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">Supabase profil verisi güncellenir.</p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Profili Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
