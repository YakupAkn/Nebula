"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
              N
            </span>
            <span className="font-bold text-slate-900 text-base">Nebula</span>
          </Link>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ekibiniz için doğru planı seçin.
          </h1>
          <p className="text-base text-slate-600">
            Küçük başlayın. İhtiyacınız büyüdükçe Nebula da sizinle büyüsün.
          </p>

          {!selectedPlan && (
            <div className="pt-4 flex items-center justify-center">
              <div className="bg-slate-200/80 p-1 rounded-xl inline-flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    cycle === "monthly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Aylık Ödeme
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
                    cycle === "yearly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Yıllık Ödeme</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    2 Ay Ücretsiz
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedPlan && currentPlan ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m7.5-7.5L3 12m7.5 0h10.5" />
                </svg>
                Geri
              </button>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                {currentPlan.name}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Plan yükseltme</p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{currentPlan.name} ile devam et</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCycle("monthly")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    cycle === "monthly"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Aylık</p>
                  <p className="mt-2 text-2xl font-extrabold">₺{currentPlan.price.monthly}</p>
                  <p className="text-[11px] text-slate-500">/ ay</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCycle("yearly")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    cycle === "yearly"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Yıllık</p>
                  <p className="mt-2 text-2xl font-extrabold">₺{currentPlan.price.yearly}</p>
                  <p className="text-[11px] text-slate-500">/ yıl</p>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Seçili fiyat</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">₺{currentPrice}</p>
                <p className="text-xs text-slate-500">{cycle === "monthly" ? "/ ay" : "/ yıl"}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">{currentPlan.name} ile şunların kilidini aç:</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {(PLAN_FEATURES[selectedPlan as Exclude<PlanId, "FREE">] ?? []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={handleMockCheckout}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Ödemeye geç
              </button>

              {checkoutNotice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {checkoutNotice}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{PLAN_PRICING.FREE.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{PLAN_PRICING.FREE.description}</p>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-extrabold text-slate-900">₺0</span>
                    <span className="text-xs text-slate-500 font-medium">/ ay</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">✓ <strong>3</strong> Ekip Üyesi</li>
                    <li className="flex items-center gap-2">✓ <strong>2</strong> Proje</li>
                    <li className="flex items-center gap-2">✓ <strong>100</strong> Görev Limiti</li>
                    <li className="flex items-center gap-2">✓ Kanban & Realtime Senkronizasyon</li>
                    <li className="flex items-center gap-2">✓ 7 Günlük Aktivite Geçmişi</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect("FREE")}
                  className="mt-8 w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
                >
                  {PLAN_PRICING.FREE.cta}
                </button>
              </div>

              <div className="bg-white rounded-2xl border-2 border-indigo-600 p-8 flex flex-col justify-between shadow-xl relative scale-105">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  En Popüler
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{PLAN_PRICING.PRO.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{PLAN_PRICING.PRO.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-extrabold text-slate-900">{formatPrice("PRO")}</span>
                      <span className="text-xs text-slate-500 font-medium">/ ay</span>
                    </div>
                    {cycle === "yearly" && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1">
                        Yıllık ₺{PLAN_PRICING.PRO.price.yearly} faturalandırılır
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">✓ <strong>10</strong> Ekip Üyesi & <strong>10</strong> Proje</li>
                    <li className="flex items-center gap-2">✓ <strong>Sınırsız</strong> Görev Oluşturma</li>
                    <li className="flex items-center gap-2">✓ Gelişmiş İstatistikler & Raporlama</li>
                    <li className="flex items-center gap-2">✓ Takvim & Plan Görünümü</li>
                    <li className="flex items-center gap-2">✓ 90 Günlük Aktivite Geçmişi</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect("PRO")}
                  className="mt-8 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  {PLAN_PRICING.PRO.cta}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{PLAN_PRICING.BUSINESS.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{PLAN_PRICING.BUSINESS.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-extrabold text-slate-900">{formatPrice("BUSINESS")}</span>
                      <span className="text-xs text-slate-500 font-medium">/ ay</span>
                    </div>
                    {cycle === "yearly" && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1">
                        Yıllık ₺{PLAN_PRICING.BUSINESS.price.yearly} faturalandırılır
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                    <li className="flex items-center gap-2">✓ <strong>Sınırsız</strong> Üye & Proje</li>
                    <li className="flex items-center gap-2">✓ 50 GB Dosya Depolama</li>
                    <li className="flex items-center gap-2">✓ Ekip Yönetimi & Organizasyon Rolleri</li>
                    <li className="flex items-center gap-2">✓ Sınırsız Aktivite Geçmişi</li>
                    <li className="flex items-center gap-2">✓ Öncelikli Destek Hattı</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlanSelect("BUSINESS")}
                  className="mt-8 w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
                >
                  {PLAN_PRICING.BUSINESS.cta}
                </button>
              </div>
            </div>

            <div className="max-w-5xl mx-auto pt-12 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 text-center">Detaylı Karşılaştırma</h2>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 font-bold text-slate-700">Özellikler</th>
                      <th className="py-4 px-4 font-bold text-slate-700 text-center">Free</th>
                      <th className="py-4 px-4 font-bold text-indigo-600 text-center">Pro</th>
                      <th className="py-4 px-4 font-bold text-slate-700 text-center">Business</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {COMPARISON_FEATURES.map((cat, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="py-2.5 px-6 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            {cat.category}
                          </td>
                        </tr>
                        {cat.features.map((feat, fIdx) => (
                          <tr key={fIdx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-6 font-medium text-slate-800">{feat.name}</td>
                            <td className="py-3 px-4 text-center text-slate-600">
                              {typeof feat.free === "boolean" ? (feat.free ? "✓" : "—") : feat.free}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-indigo-600">
                              {typeof feat.pro === "boolean" ? (feat.pro ? "✓" : "—") : feat.pro}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600">
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

      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        Nebula &copy; 2026 — Tüm hakları saklıdır.
      </footer>
    </div>
  );
}