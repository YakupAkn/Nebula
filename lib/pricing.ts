export type BillingCycle = "monthly" | "yearly";
export type PlanId = "FREE" | "PRO" | "BUSINESS";

export const PLAN_PRICING = {
  FREE: {
    id: "FREE",
    name: "Free",
    description: "Küçük ekipler ve kişisel projeler için tamamen kullanışlı temel paket.",
    price: {
      monthly: 0,
      yearly: 0,
    },
    popular: false,
    cta: "Ücretsiz Başla",
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    description: "Büyüyen ekipler, gelişmiş planlama ve raporlama araçları için.",
    price: {
      monthly: 149,
      yearly: 1490, // Yıllıkta 2 ay bedava
    },
    popular: true,
    cta: "Pro'ya Geç",
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    description: "Gelişmiş güvenlik, organizasyon izinleri ve ölçeklenen ekipler için.",
    price: {
      monthly: 349,
      yearly: 3490,
    },
    popular: false,
    cta: "Business'a Geç",
  },
} as const;

export interface FeatureComparison {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
}

export const COMPARISON_FEATURES: { category: string; features: FeatureComparison[] }[] = [
  {
    category: "Temel Limitler",
    features: [
      { name: "Ekip Üyesi", free: "3", pro: "10", business: "Sınırsız" },
      { name: "Proje Sayısı", free: "2", pro: "10", business: "Sınırsız" },
      { name: "Görev Sayısı", free: "100", pro: "Sınırsız", business: "Sınırsız" },
      { name: "Dosya Depolama", free: "100 MB", pro: "5 GB", business: "50 GB" },
    ],
  },
  {
    category: "Proje & Görev Yönetimi",
    features: [
      { name: "Kanban Görünümü", free: true, pro: true, business: true },
      { name: "Gerçek Zamanlı Senkronizasyon", free: true, pro: true, business: true },
      { name: "Görev Atama & Yorumlar", free: true, pro: true, business: true },
      { name: "Öncelik ve Bitiş Tarihi", free: true, pro: true, business: true },
      { name: "Gelişmiş Filtreler", free: false, pro: true, business: true },
      { name: "Takvim & Plan Görünümü", free: false, pro: true, business: true },
    ],
  },
  {
    category: "Raporlama & Yönetim",
    features: [
      { name: "Gelişmiş İstatistikler", free: false, pro: true, business: true },
      { name: "Aktivite Geçmişi", free: "7 gün", pro: "90 gün", business: "Sınırsız" },
      { name: "Ekip Yönetimi", free: false, pro: false, business: true },
      { name: "Organizasyon Rolleri & Özel İzinler", free: false, pro: false, business: true },
      { name: "Öncelikli Destek", free: false, pro: false, business: true },
    ],
  },
];