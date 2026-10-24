import React from "react";

// ==========================================
// PRIMITIVES
// Renkler ve animasyon globals.css içindeki .skeleton sınıfından gelir.
// Buraya koyu/renkli dolgu (bg-slate-900, bg-indigo-* vb.) EKLEME:
// placeholder gerçek arayüz gibi görünür.
// ==========================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${
        className.includes("rounded") ? "" : "rounded-md"
      } pointer-events-none select-none ${className}`}
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

// Gerçek TaskCard ile aynı iskelet: sol çubuk, etiket, başlık, alt satır
function TaskCardSkeleton({ titleWidth = "w-4/5" }: { titleWidth?: string }) {
  return (
    <div className="bg-white p-4 pl-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
      <Skeleton className="absolute left-0 top-0 bottom-0 w-1.5 rounded-none" />
      <div className="flex items-center gap-1.5 mb-3">
        <Skeleton className="h-4 w-14 rounded-md" />
        <Skeleton className="h-4 w-10 rounded" />
      </div>
      <Skeleton className={`h-4 ${titleWidth}`} />
      <Skeleton className="h-3 w-3/5 mt-2" />
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-3 w-14" />
        <SkeletonCircle className="h-6 w-6" />
      </div>
    </div>
  );
}

// ==========================================
// SHARED HEADER (Ayarlar, Profil, Üyeler)
// Gerçek header ile aynı kapsayıcı: max-w-6xl, h-16
// ==========================================

export function SecondaryHeaderSkeleton() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Skeleton className="h-6 w-20" />
          <div className="hidden sm:flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
}

// ==========================================
// DASHBOARD
// app/page.tsx ile birebir aynı ölçüler: bg-[#fafafa], max-w-[1400px],
// header h-16 md:h-[72px], 3 kolon, min-h-[500px]. Böylece içerik
// yüklenince sayfa kaymaz. Kolonlarda "boş durum" yerine kart iskeleti var.
// ==========================================

const DASHBOARD_COLUMNS = [
  { title: "Yapılacaklar", dot: "bg-indigo-500", cards: ["w-4/5", "w-2/3", "w-3/4"] },
  { title: "Devam Edenler", dot: "bg-amber-500", cards: ["w-3/4", "w-4/5"] },
  { title: "Tamamlananlar", dot: "bg-emerald-500", cards: ["w-2/3", "w-3/4"] },
];

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans" role="status" aria-busy="true">
      <span className="sr-only">Yükleniyor</span>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 md:h-[72px] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Nebula
              </span>
            </div>
            <Skeleton className="hidden sm:block h-3 w-44 mt-1.5" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="hidden sm:block h-4 w-14" />
            <Skeleton className="hidden sm:block h-4 w-12" />
            <Skeleton className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
            <Skeleton className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DASHBOARD_COLUMNS.map((col, i) => (
            <div
              key={col.title}
              className={`flex flex-col bg-slate-100/60 rounded-2xl p-4 min-h-[500px] border border-slate-200/60 w-full ${
                i > 0 ? "hidden md:flex" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h2 className="font-semibold text-slate-700 text-sm tracking-tight">
                    {col.title}
                  </h2>
                </div>
                <Skeleton className="h-5 w-7 rounded-full" />
              </div>

              <div className="flex flex-col gap-3">
                {col.cards.map((w, idx) => (
                  <TaskCardSkeleton key={idx} titleWidth={w} />
                ))}
              </div>
            </div>
          ))}
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
    <div className="min-h-screen bg-slate-50 font-sans" role="status" aria-busy="true">
      <span className="sr-only">Yükleniyor</span>
      <SecondaryHeaderSkeleton />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Başlık Alanı */}
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-3 w-16 mb-1.5" />
            <Skeleton className="h-7 w-72" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl border border-slate-200" />
        </div>

        {/* 2 Kolonlu Grid Yapısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Sol Kolon */}
          <div className="space-y-6">
            {/* Kart 1: GENEL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-12 rounded-full" />
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
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </div>

            {/* Kart 2: PROJELER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-6 w-32" />
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="space-y-6">
            {/* Kart 1: ÜYELER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-5 w-12 rounded-full" />
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
              <Skeleton className="h-11 w-full rounded-xl border border-red-200" />
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
    <div className="min-h-screen bg-slate-50 font-sans" role="status" aria-busy="true">
      <span className="sr-only">Yükleniyor</span>
      <SecondaryHeaderSkeleton />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Başlık Alanı */}
        <div>
          <Skeleton className="h-3 w-12 mb-1.5" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-96 mt-1.5" />
        </div>

        {/* Profil Form Kartı */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          {/* Avatar ve Kullanıcı Başlığı */}
          <div className="flex items-center gap-4">
            <SkeletonCircle size="xl" className="h-16 w-16" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          {/* Input Alanları */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-11 w-full rounded-xl border border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-11 w-full rounded-xl border border-slate-200" />
            </div>
          </div>

          {/* Alt Bilgi ve Kaydet Butonu */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-10 w-32 rounded-xl" />
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
    <div className="min-h-screen bg-slate-50 font-sans" role="status" aria-busy="true">
      <span className="sr-only">Yükleniyor</span>
      <SecondaryHeaderSkeleton />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Başlık Alanı */}
        <div>
          <Skeleton className="h-3 w-12 mb-1.5" />
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
                <Skeleton className="h-11 w-full rounded-xl border border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-12" />
                <Skeleton className="h-11 w-full rounded-xl border border-slate-200" />
              </div>

              <Skeleton className="h-11 w-full rounded-xl pt-2" />
            </div>
          </div>

          {/* Sağ Kart: Mevcut üyeler */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-12 rounded-full" />
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

// Pricing sayfası koyu (bg-black), iskelet de koyu tonda
export function PricingSkeleton() {
  return (
    <div
      data-skeleton-tone="dark"
      className="min-h-screen bg-black text-neutral-100 font-sans p-6 md:p-8 space-y-8"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Yükleniyor</span>
      <div className="text-center space-y-3 max-w-xl mx-auto pt-8">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-80 max-w-full mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto rounded-full mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-6">
        {[1, 2, 3].map((plan) => (
          <div
            key={plan}
            className={`p-6 rounded-2xl border bg-white/5 space-y-6 flex flex-col justify-between ${
              plan === 2 ? "border-white/25" : "border-white/10"
            }`}
          >
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
              <div className="pt-4 space-y-2 border-t border-white/10">
                {[1, 2, 3, 4].map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <SkeletonCircle className="h-4 w-4" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
