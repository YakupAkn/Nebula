import React from "react";

// ==========================================
// PRIMITIVE SKELETON COMPONENTS
// ==========================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      className={`animate-pulse rounded-md bg-slate-200/80 pointer-events-none select-none ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className="space-y-2 w-full" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${
            index === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          } ${className}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl" | string;
  className?: string;
}) {
  const sizeClasses: Record<string, string> = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const selectedSize = sizeClasses[size] || size;

  return (
    <Skeleton className={`rounded-full shrink-0 ${selectedSize} ${className}`} />
  );
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 w-24 rounded-xl ${className}`} />;
}

export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={`p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 ${className}`}
    >
      {children || (
        <>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-1/4" />
            <SkeletonCircle size="sm" />
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// SHARED SKELETON HEADERS
// ==========================================

// Secondary Header (Ayarlar, Profil, Üyeler sayfaları için)
export function SecondaryHeaderSkeleton() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Sol: Logo ve Isim */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-lg bg-indigo-600/80" />
        <Skeleton className="h-5 w-20 bg-slate-300" />
      </div>

      {/* Orta: Sekmeler (Projeler, Üyeler, Profil, Ayarlar) */}
      <div className="hidden sm:flex items-center gap-1">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg bg-indigo-100" />
      </div>

      {/* Sag: Dashboard Butonu */}
      <div>
        <Skeleton className="h-8 w-28 rounded-full border border-slate-200" />
      </div>
    </header>
  );
}

// ==========================================
// PAGE LEVEL SKELETON COMPONENTS
// ==========================================

/**
 * DASHBOARD SKELETON
 * Ekran Görüntüsü 1'e tamamen uygun:
 * - Sol üst Nebula başlık, CANLI rozeti, alt açıklama
 * - Sağ üst navigasyon butonları ve yuvarlak ekle butonu
 * - 3 adet Kanban Kolonu (Yapılacaklar, Devam Edenler, Tamamlananlar)
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans" aria-hidden="true">
      {/* Dashboard Header */}
      <header className="py-4 px-6 md:px-8 border-b border-slate-200/80 bg-white flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-24 bg-slate-800" />
            <Skeleton className="h-5 w-14 rounded-full bg-indigo-100" />
          </div>
          <Skeleton className="h-3.5 w-48 mt-1.5" />
        </div>

        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-14 hidden sm:block" />
          <Skeleton className="h-4 w-12 hidden sm:block" />
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full bg-slate-900" />
        </div>
      </header>

      {/* Kanban Panosu Grid */}
      <main className="flex-1 p-6 md:p-8 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto h-full">
          {/* Kolon 1: Yapılacaklar */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-4 min-h-[550px]">
            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full bg-slate-200" />
            </div>
            <div className="border-2 border-dashed border-slate-200/80 rounded-xl p-4 flex-1 flex flex-col items-center justify-center space-y-3">
              <SkeletonCircle size="sm" className="h-8 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Kolon 2: Devam Edenler */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-4 min-h-[550px]">
            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full bg-slate-200" />
            </div>
            <div className="border-2 border-dashed border-slate-200/80 rounded-xl p-4 flex-1 flex flex-col items-center justify-center space-y-3">
              <SkeletonCircle size="sm" className="h-8 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Kolon 3: Tamamlananlar */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-4 min-h-[550px]">
            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full bg-slate-200" />
            </div>
            <div className="border-2 border-dashed border-slate-200/80 rounded-xl p-4 flex-1 flex flex-col items-center justify-center space-y-3">
              <SkeletonCircle size="sm" className="h-8 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * SETTINGS SKELETON
 * Ekran Görüntüsü 2'ye (Ayarlar) tamamen uygun:
 * - AYARLAR başlığı ve sağ üst Organizasyon seçici
 * - Sol Kolon: GENEL (3'lü istatistik kutusu) + PROJELER kartı
 * - Sağ Kolon: ÜYELER (Ekip kutusu) + HESAP (Oturumu kapat butonu)
 */
export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans" aria-hidden="true">
      <SecondaryHeaderSkeleton />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Başlık Alanı */}
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-3 w-16 bg-indigo-200 mb-1.5" />
            <Skeleton className="h-7 w-72" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl border border-slate-200 bg-white" />
        </div>

        {/* 2 Kolonlu Grid Yapısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Sol Kolon */}
          <div className="space-y-6">
            {/* Kart 1: GENEL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-12 rounded-full bg-indigo-100" />
              </div>
              <Skeleton className="h-6 w-24" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-6 w-6" />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-6 w-6" />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-6 w-12 bg-emerald-100" />
                </div>
              </div>
            </div>

            {/* Kart 2: PROJELER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-14 rounded-full bg-slate-100" />
              </div>
              <Skeleton className="h-6 w-32" />
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-12 rounded-full bg-emerald-100" />
              </div>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="space-y-6">
            {/* Kart 1: ÜYELER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-5 w-12 rounded-full bg-slate-100" />
              </div>
              <Skeleton className="h-6 w-20" />
              <div className="border border-dashed border-slate-200 rounded-xl p-8 flex items-center justify-center">
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            {/* Kart 2: HESAP */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-11 w-full rounded-xl border border-red-200 bg-red-50/50" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * PROFILE SKELETON
 * Ekran Görüntüsü 3'e (Profil) tamamen uygun:
 * - HESAP alt başlığı, Profil başlığı ve Supabase açıklama metni
 * - Yuvarlak mor avatar rozeti, Kullanıcı adı ve e-posta
 * - Ad Soyad ve E-posta input alanları
 * - Sağ altta siyah Profili Kaydet butonu
 */
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans" aria-hidden="true">
      <SecondaryHeaderSkeleton />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Başlık Alanı */}
        <div>
          <Skeleton className="h-3 w-12 bg-indigo-200 mb-1.5" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-96 mt-1.5" />
        </div>

        {/* Profil Form Kartı */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          {/* Avatar ve Kullanıcı Başlığı */}
          <div className="flex items-center gap-4">
            <SkeletonCircle size="xl" className="h-16 w-16 bg-indigo-600/80" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          {/* Input Alanları */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50" />
            </div>
          </div>

          {/* Alt Bilgi ve Kaydet Butonu */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-10 w-32 rounded-xl bg-slate-900" />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * MEMBERS SKELETON
 * Ekran Görüntüsü 4'e (Üyeler) tamamen uygun:
 * - TAKIM alt başlığı, Üyeler başlığı ve açıklama metni
 * - Sol Kart: YENİ ÜYE (Ekip ekle, E-posta ve Rol formu, Üye Ekle siyah butonu)
 * - Sağ Kart: EKİP (Mevcut üyeler, 0 kişi rozeti, kesikli çizgili boş üye kutusu)
 */
export function MembersSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans" aria-hidden="true">
      <SecondaryHeaderSkeleton />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Başlık Alanı */}
        <div>
          <Skeleton className="h-3 w-12 bg-indigo-200 mb-1.5" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-96 mt-1.5" />
        </div>

        {/* 2 Kolonlu Grid Yapısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Sol Kart: Ekip ekle */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-28" />

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-12" />
                <Skeleton className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50" />
              </div>

              <Skeleton className="h-11 w-full rounded-xl bg-slate-900 pt-2" />
            </div>
          </div>

          {/* Sağ Kart: Mevcut üyeler */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-12 rounded-full bg-slate-100" />
            </div>
            <Skeleton className="h-6 w-32" />

            <div className="border border-dashed border-slate-200 rounded-xl p-10 flex items-center justify-center mt-4">
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans p-6 md:p-8 space-y-8" aria-hidden="true">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto rounded-full mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-6">
        {[1, 2, 3].map((plan) => (
          <div
            key={plan}
            className={`p-6 rounded-2xl border bg-white shadow-sm space-y-6 flex flex-col justify-between ${
              plan === 2 ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
            }`}
          >
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
              <div className="pt-4 space-y-2 border-t border-slate-100">
                {[1, 2, 3, 4].map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <SkeletonCircle size="sm" className="h-4 w-4" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className={`h-11 w-full rounded-xl ${plan === 2 ? "bg-slate-900" : "bg-slate-200"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}