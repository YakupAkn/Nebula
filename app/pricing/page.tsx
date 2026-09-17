"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StarBackground from "@/components/StarBackground";
import { PLAN_PRICING, COMPARISON_FEATURES, BillingCycle, PlanId } from "@/lib/pricing";

const PLAN_FEATURES: Record<Exclude<PlanId, "FREE">, string[]> = {
  PRO: [
    "10 üye",
    "10 proje",
    "Sınırsız görev",
    "Plan görünümü",
    "Gelişmiş istatistikler",
  ],
  BUSINESS: [
    "Sınırsız üye",
    "Sınırsız proje",
    "Özel ekip rolleri",
    "Sınırsız etkinlik geçmişi",
    "Öncelikli destek",
  ],
};

export default function PricingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const formatPrice = (planId: PlanId) => {
    const plan = PLAN_PRICING[planId];
    const amount = cycle === "monthly" ? plan.price.monthly : Math.round(plan.price.yearly / 12);
    return amount === 0 ? "₺0" : `₺${amount}`;
  };

  const handlePlanSelect = (planId: PlanId) => {
    if (planId === "FREE") {
      router.push("/");
      return;
    }

    setSelectedPlan(planId);
    setCheckoutNotice(null);
  };

  const handleMockCheckout = () => {
    setCheckoutNotice("Gerçek ödeme altyapısı henüz bağlanmadı. Önce plan sistemi ve webhook altyapısı kurulacak.");
  };

  const currentPlan = selectedPlan ? PLAN_PRICING[selectedPlan] : null;
  const currentPrice = currentPlan
    ? cycle === "monthly"
      ? currentPlan.price.monthly
      : Math.round(currentPlan.price.yearly / 12)
    : 0;

  return (
    <div className="relative min-h-screen bg-black text-neutral-100 flex flex-col justify-between overflow-hidden antialiased selection:bg-white selection:text-black">
      {/* Uzay / Yıldızlar Arka Plan Katmanı */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <StarBackground />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/60 border-b border-neutral-800/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <span className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-105">
              N
            </span>
            <span className="font-bold text-white text-lg tracking-tight">Nebula</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m7.5-7.5L3 12m7.5 0h10.5" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1 w-full space-y-12">
        {/* Title & Cycle Toggle */}
        <div className="text-center space-y-3.5 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Ekibiniz için doğru planı seçin.
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 font-normal leading-relaxed">
            Küçük başlayın. İhtiyacınız büyüdükçe Nebula da sizinle büyüsün.
          </p>

          {!selectedPlan && (
            <div className="pt-4 flex items-center justify-center">
              <div className="bg-neutral-900/90 p-1 rounded-full inline-flex items-center space-x-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    cycle === "monthly"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Aylık Ödeme
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center space-x-1.5 ${
                    cycle === "yearly"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>Yıllık Ödeme</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    cycle === "yearly" ? "bg-black text-white" : "bg-neutral-800 text-neutral-200"
                  }`}>
                    2 Ay Ücretsiz
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Plan View (Mock Checkout) */}
        {selectedPlan && currentPlan ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-900/80 p-7 shadow-2xl backdrop-blur-md sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-800 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m7.5-7.5L3 12m7.5 0h10.5" />
                </svg>
                Geri
              </button>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                {currentPlan.name}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Plan yükseltme</p>
                <h2 className="mt-1.5 text-3xl font-black text-white tracking-tight">{currentPlan.name} ile devam et</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    cycle === "monthly"
                      ? "border-white bg-white text-black shadow-sm"
                      : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Aylık</p>
                  <p className="mt-1 text-2xl font-black">₺{currentPlan.price.monthly}</p>
                  <p className={`text-[11px] font-medium ${cycle === "monthly" ? "text-neutral-600" : "text-neutral-500"}`}>/ ay</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    cycle === "yearly"
                      ? "border-white bg-white text-black shadow-sm"
                      : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Yıllık</p>
                  <p className="mt-1 text-2xl font-black">₺{currentPlan.price.yearly}</p>
                  <p className={`text-[11px] font-medium ${cycle === "yearly" ? "text-neutral-600" : "text-neutral-500"}`}>/ yıl</p>
                </button>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
                <p className="text-xs font-medium text-neutral-400">Seçili fiyat</p>
                <p className="mt-1 text-3xl font-black text-white">₺{currentPrice}</p>
                <p className="text-xs text-neutral-500">{cycle === "monthly" ? "/ ay" : "/ yıl"}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-neutral-200">{currentPlan.name} ile şunların kilidini aç:</p>
                <ul className="space-y-2 text-xs text-neutral-400 font-medium">
                  {(PLAN_FEATURES[selectedPlan as Exclude<PlanId, "FREE">] ?? []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-black">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={handleMockCheckout}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
              >
                Ödemeye geç
              </button>

              {checkoutNotice && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-xs text-neutral-200 font-medium leading-relaxed">
                  {checkoutNotice}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Plan Cards Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {/* FREE */}
              <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-8 flex flex-col justify-between shadow-lg backdrop-blur-sm hover:border-neutral-700 transition">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{PLAN_PRICING.FREE.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-normal">{PLAN_PRICING.FREE.description}</p>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-white tracking-tight">₺0</span>
                    <span className="text-xs text-neutral-400 font-medium">/ ay</span>
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300 border-t border-neutral-800/80 pt-6 font-normal">
                    <li className="flex items-center gap-2">✓ <strong className="font-semibold text-white">3</strong> Ekip Üyesi</li>
                    <li className="flex items-center gap-2">✓ <strong className="font-semibold text-white">2</strong> Proje</li>
                    <li className="flex items-center gap-2">✓ <strong className="font-semibold text-white">100</strong> Görev Limiti</li>
                    <li className="flex items-center gap-2">✓ Kanban & Realtime Senkronizasyon</li>
                    <li className="flex items-center gap-2">✓ 7 Günlük Aktivite Geçmişi</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect("FREE")}
                  className="mt-8 w-full py-2.5 px-4 rounded-xl border border-neutral-700 text-neutral-200 hover:bg-neutral-800 font-semibold text-xs transition"
                >
                  {PLAN_PRICING.FREE.cta}
                </button>
              </div>

              {/* PRO (Featured) */}
              <div className="bg-neutral-900/90 rounded-2xl border-2 border-white p-8 flex flex-col justify-between shadow-2xl relative scale-105 backdrop-blur-md">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                  En Popüler
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{PLAN_PRICING.PRO.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-normal">{PLAN_PRICING.PRO.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-black text-white tracking-tight">{formatPrice("PRO")}</span>
                      <span className="text-xs text-neutral-400 font-medium">/ ay</span>
                    </div>
                    {cycle === "yearly" && (
                      <p className="text-[11px] text-neutral-300 font-medium mt-1">
                        Yıllık ₺{PLAN_PRICING.PRO.price.yearly} faturalandırılır
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300 border-t border-neutral-800 pt-6 font-normal">
                    <li className="flex items-center gap-2">✓ <strong className="font-semibold text-white">10</strong> Ekip Üyesi & <strong className="font-semibold text-white">10</strong> Proje</li>
                    <li className="flex items-center gap-2">✓ <strong className="font-semibold text-white">Sınırsız</strong> Görev Oluşturma</li>
                    <li className="flex items-center gap-2">✓ Gelişmiş İstatistikler & Raporlama</li>
                    <li className="flex items-center gap-2">✓ Takvim & Plan Görünümü</li>
                    <li className="flex items-center gap-2">✓ 90 Günlük Aktivite Geçmişi</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect("PRO")}
                  className="mt-8 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition shadow-md"
                >
                  {PLAN_PRICING.PRO.cta}
                </button>
              </div>

              {/* BUSINESS */}
              <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-8 flex flex-col justify-between shadow-lg backdrop-blur-sm hover:border-neutral-700 transition">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{PLAN_PRICING.BUSINESS.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-normal">{PLAN_PRICING.BUSINESS.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-black text-white tracking-tight">{formatPrice("BUSINESS")}</span>
                      <span className="text-xs text-neutral-400 font-medium">/ ay</span>
                    </div>
                    {cycle === "yearly" && (
                      <p className="text-[11px] text-neutral-300 font-medium mt-1">
                        Yıllık ₺{PLAN_PRICING.BUSINESS.price.yearly} faturalandırılır
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300 border-t border-neutral-800/80 pt-6 font-normal">
                    <li className="flex items-center gap-2">✓ <strong className="font-semibold text-white">Sınırsız</strong> Üye & Proje</li>
                    <li className="flex items-center gap-2">✓ 50 GB Dosya Depolama</li>
                    <li className="flex items-center gap-2">✓ Ekip Yönetimi & Organizasyon Rolleri</li>
                    <li className="flex items-center gap-2">✓ Sınırsız Aktivite Geçmişi</li>
                    <li className="flex items-center gap-2">✓ Öncelikli Destek Hattı</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect("BUSINESS")}
                  className="mt-8 w-full py-2.5 px-4 rounded-xl border border-neutral-700 text-neutral-200 hover:bg-neutral-800 font-semibold text-xs transition"
                >
                  {PLAN_PRICING.BUSINESS.cta}
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="max-w-5xl mx-auto pt-12 space-y-6">
              <h2 className="text-xl font-bold text-white text-center tracking-tight">Detaylı Karşılaştırma</h2>

              <div className="bg-neutral-900/70 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl backdrop-blur-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-950/80 border-b border-neutral-800">
                      <th className="py-4 px-6 font-bold text-neutral-300 tracking-wide uppercase text-[11px]">Özellikler</th>
                      <th className="py-4 px-4 font-bold text-neutral-300 text-center tracking-wide uppercase text-[11px]">Free</th>
                      <th className="py-4 px-4 font-bold text-white text-center tracking-wide uppercase text-[11px]">Pro</th>
                      <th className="py-4 px-4 font-bold text-neutral-300 text-center tracking-wide uppercase text-[11px]">Business</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {COMPARISON_FEATURES.map((cat, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="bg-neutral-950/40">
                          <td colSpan={4} className="py-2.5 px-6 font-bold text-neutral-400 uppercase tracking-widest text-[10px]">
                            {cat.category}
                          </td>
                        </tr>
                        {cat.features.map((feat, fIdx) => (
                          <tr key={fIdx} className="hover:bg-neutral-800/40 transition">
                            <td className="py-3 px-6 font-medium text-neutral-200">{feat.name}</td>
                            <td className="py-3 px-4 text-center text-neutral-400 font-medium">
                              {typeof feat.free === "boolean" ? (feat.free ? "✓" : "—") : feat.free}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-white">
                              {typeof feat.pro === "boolean" ? (feat.pro ? "✓" : "—") : feat.pro}
                            </td>
                            <td className="py-3 px-4 text-center text-neutral-400 font-medium">
                              {typeof feat.business === "boolean" ? (feat.business ? "✓" : "—") : feat.business}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-neutral-800 bg-black/80 text-center text-xs text-neutral-500 font-medium backdrop-blur-sm">
        Nebula &copy; 2026 — Tüm hakları saklıdır.
      </footer>
    </div>
  );
}