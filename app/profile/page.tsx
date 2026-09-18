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
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
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
        setCreatedAt(user.created_at ?? null);
        setLastSignIn(user.last_sign_in_at ?? null);

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

      if (error) throw error;

      setMessage({ type: "success", text: "Profiliniz başarıyla güncellendi." });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Güncelleme sırasında bir hata oluştu.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Çıkış hatası:", err);
      setMessage({ type: "error", text: "Oturum kapatılırken bir hata oluştu." });
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== email) return;

    try {
      setDeletingAccount(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Oturum bulunamadı.");
      }

      const { data, error } = await supabase.functions.invoke(
        "delete-account",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Hesap silinemedi.");
      }

      await supabase.auth.signOut();

      router.push("/");
    } catch (err: unknown) {
      console.error("Hesap silme hatası:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Hesap silinirken bir hata oluştu.";

      setMessage({
        type: "error",
        text: errorMessage,
      });

      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const getInitials = (name: string, mail: string) => {
    if (name.trim()) {
      return name.split(" ").filter(Boolean).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
    }
    return mail.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-rose-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Hesabı Sil</h3>
                <p className="text-xs text-slate-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Onaylamak için e-posta adresinizi yazın:
            </p>
            <p className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 mb-3 select-none">
              {email}
            </p>
            <input
              type="email"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="E-posta adresinizi yazın"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== email || deletingAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {deletingAccount ? "Siliniyor..." : "Hesabı Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">N</span>
              <span>Nebula</span>
            </Link>
            <nav className="hidden md:flex space-x-2">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">Projeler</Link>
              <Link href="/members" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">Üyeler</Link>
              <Link href="/profile" className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md">Profil</Link>
              <Link href="/settings" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition">Ayarlar</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              {signingOut ? "Çıkılıyor..." : "Oturumu Kapat"}
            </button>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Hesap</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Profil</h1>
          <p className="text-sm text-slate-500 mt-1">Kişisel bilgilerinizi Supabase profil kaydınızdan yönetebilirsiniz.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName || "Kullanıcı"} className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {getInitials(fullName, email)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{fullName || "Kullanıcı"}</h3>
                <p className="text-sm text-slate-500">{email || "E-posta bilinmiyor"}</p>
                <p className="text-xs text-slate-400 mt-0.5">Üye: {formatDate(createdAt)}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Son Giriş</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(lastSignIn)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-400 mb-0.5">Hesap Durumu</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <p className="text-sm font-medium text-slate-700">Aktif</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
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
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">E-posta Adresi</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Değiştirilemez</span>
                </div>
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

        {/* Session Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Oturum Yönetimi</h2>
            <p className="text-xs text-slate-500 mb-5">Aktif oturumunuzu güvenli şekilde sonlandırın.</p>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              {signingOut ? "Oturum kapatılıyor..." : "Oturumu Kapat"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-sm font-semibold text-rose-700 mb-1">Tehlikeli Bölge</h2>
            <p className="text-xs text-slate-500 mb-5">Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz.</p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Hesabı Sil
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}