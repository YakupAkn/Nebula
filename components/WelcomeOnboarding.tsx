"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LEGAL } from "@/lib/legal";

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
  /** Eski kullanıcılar için: sadece Kullanım Şartları onayı sorulur */
  legalOnly?: boolean;
}

const OCCUPATIONS = [
  "Yazılım geliştirici",
  "Tasarımcı",
  "Ürün / Proje yöneticisi",
  "Öğrenci",
  "Girişimci / Kurucu",
  "Diğer",
];

const TEAM_FOCUS = [
  "Yazılım geliştirme",
  "Tasarım",
  "Pazarlama / İçerik",
  "Eğitim / Okul projesi",
  "Donanım / Robotik",
  "Diğer",
];

const TEAM_OPTIONS = [
  { id: "1", label: "Sadece Ben", desc: "Kişisel projeler için" },
  { id: "2-5", label: "2 - 5 Kişi", desc: "Küçük çekirdek ekip" },
  { id: "6-20", label: "6 - 20 Kişi", desc: "Büyüyen takım" },
  { id: "20+", label: "20+ Kişi", desc: "Geniş organizasyon" },
];

const REFERRAL_OPTIONS = [
  "Google / Arama Motoru",
  "LinkedIn / X (Twitter)",
  "Arkadaş / Tavsiye",
  "Topluluk / Forum",
  "Diğer",
];

/** Taslak her adımda localStorage'e yazılır; sekme/sayfa değişse de kaybolmaz. */
interface OnboardingDraft {
  step: number;
  occupation: string;
  teamFocus: string[];
  teamSize: string;
  referralSource: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
}

const draftKey = (userId: string, legalOnly: boolean) =>
  `nebula:onboarding:${legalOnly ? "legal" : "full"}:${userId}`;

function readDraft(key: string): Partial<OnboardingDraft> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: OnboardingDraft) {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Depolama dolu ya da kapalı olabilir; akış state ile devam eder.
  }
}

function clearDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

const chip = (active: boolean) =>
  `p-3.5 rounded-xl border text-left text-xs font-medium transition-all ${
    active
      ? "border-indigo-500 bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500"
      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-zinc-300"
  }`;

const primaryBtn =
  "flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2";
const backBtn =
  "px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-xl border border-zinc-800";

export function WelcomeOnboarding({ userId, onComplete, legalOnly = false }: OnboardingProps) {
  const TOTAL = legalOnly ? 1 : 4;
  const storageKey = draftKey(userId, legalOnly);

  // Bileşen yalnızca oturum açıldıktan sonra istemcide render edilir; taslak ilk render'da okunur
  const [initial] = useState<Partial<OnboardingDraft>>(() =>
    typeof window === "undefined" ? {} : readDraft(storageKey) ?? {}
  );
  const minStep = legalOnly ? 4 : 1;
  const [step, setStep] = useState(
    typeof initial.step === "number" ? Math.min(4, Math.max(minStep, initial.step)) : minStep
  );
  const [occupation, setOccupation] = useState(typeof initial.occupation === "string" ? initial.occupation : "");
  const [teamFocus, setTeamFocus] = useState<string[]>(
    Array.isArray(initial.teamFocus) ? initial.teamFocus.filter((x) => typeof x === "string") : []
  );
  const [teamSize, setTeamSize] = useState(typeof initial.teamSize === "string" ? initial.teamSize : "");
  const [referralSource, setReferralSource] = useState(
    typeof initial.referralSource === "string" ? initial.referralSource : ""
  );
  const [termsAccepted, setTermsAccepted] = useState(initial.termsAccepted === true);
  const [marketingConsent, setMarketingConsent] = useState(initial.marketingConsent === true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Her değişiklikte (adım, seçim, onay) localStorage'e yaz
  useEffect(() => {
    writeDraft(storageKey, {
      step,
      occupation,
      teamFocus,
      teamSize,
      referralSource,
      termsAccepted,
      marketingConsent,
    });
  }, [storageKey, step, occupation, teamFocus, teamSize, referralSource, termsAccepted, marketingConsent]);

  const toggleFocus = (item: string) =>
    setTeamFocus((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  const handleFinish = async () => {
    // Son durumu state yerine doğrudan localStorage'den al (tek doğruluk kaynağı)
    const saved = readDraft(storageKey);
    const data: OnboardingDraft = {
      step,
      occupation,
      teamFocus,
      teamSize,
      referralSource,
      termsAccepted,
      marketingConsent,
      ...(saved ?? {}),
    } as OnboardingDraft;

    if (!data.termsAccepted) return;
    setLoading(true);
    setError("");

    const now = new Date().toISOString();
    const legalFields = {
      terms_accepted_at: now,
      terms_version: LEGAL.termsVersion,
      marketing_consent: data.marketingConsent,
      marketing_consent_at: data.marketingConsent ? now : null,
    };

    const payload = legalOnly
      ? legalFields
      : {
          occupation: data.occupation,
          team_focus: data.teamFocus,
          team_size: data.teamSize,
          referral_source: data.referralSource,
          onboarding_completed: true,
          ...legalFields,
        };

    const { error: updateError } = await supabase.from("profiles").update(payload).eq("id", userId);

    setLoading(false);
    if (updateError) {
      // Hata durumunda taslak localStorage'de kalır, tekrar denenebilir
      setError("Kaydedilemedi, tekrar dene.");
      return;
    }
    clearDraft(storageKey);
    onComplete();
  };

  const stepTitle: Record<number, { title: string; desc: string }> = {
    1: { title: "Ne iş yapıyorsun?", desc: "Nebula'yı sana göre şekillendirmemize yardımcı olur." },
    2: { title: "Ekibin ne üzerine çalışıyor?", desc: "Birden fazla seçebilirsin." },
    3: { title: "Nebula'yı nereden duydun?", desc: "Bize ulaşma kanalını bilmek gelişmemize yardımcı olur." },
    4: { title: "Son adım", desc: "Devam etmeden önce şartları onayla." },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-zinc-950/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/30">
        {!legalOnly && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2 w-full max-w-[160px]">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all ${step >= n ? "bg-indigo-500" : "bg-zinc-800"}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              Adım {step} / {TOTAL}
            </span>
          </div>
        )}

        <h2 className="text-xl font-bold text-zinc-100 mb-1">
          {legalOnly ? "Kullanım Şartları güncellendi" : stepTitle[step].title}
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          {legalOnly ? "Devam etmek için şartları onaylaman gerekiyor." : stepTitle[step].desc}
        </p>

        {step === 1 && (
          <div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {OCCUPATIONS.map((o) => (
                <button key={o} type="button" onClick={() => setOccupation(o)} className={chip(occupation === o)}>
                  {o}
                </button>
              ))}
            </div>
            <button disabled={!occupation} onClick={() => setStep(2)} className={`w-full ${primaryBtn}`}>
              Devam Et
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {TEAM_FOCUS.map((f) => (
                <button key={f} type="button" onClick={() => toggleFocus(f)} className={chip(teamFocus.includes(f))}>
                  {f}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Ekip büyüklüğü</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {TEAM_OPTIONS.map((item) => (
                <button key={item.id} type="button" onClick={() => setTeamSize(item.id)} className={chip(teamSize === item.id)}>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className={backBtn}>Geri</button>
              <button disabled={teamFocus.length === 0 || !teamSize} onClick={() => setStep(3)} className={primaryBtn}>
                Devam Et
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="space-y-2 mb-6">
              {REFERRAL_OPTIONS.map((o) => (
                <button key={o} type="button" onClick={() => setReferralSource(o)} className={`w-full ${chip(referralSource === o)}`}>
                  {o}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className={backBtn}>Geri</button>
              <button disabled={!referralSource} onClick={() => setStep(4)} className={primaryBtn}>
                Devam Et
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="space-y-4 mb-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-indigo-500"
                />
                <span className="text-xs text-zinc-300 leading-relaxed">
                  <Link href="/kullanim-sartlari" target="_blank" className="text-indigo-300 underline underline-offset-2">
                    Kullanım Şartları
                  </Link>
                  'nı okudum ve kabul ediyorum. <span className="text-zinc-500">(Zorunlu)</span>
                </span>
              </label>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Kişisel verilerinin nasıl işlendiğini{" "}
                <Link href="/kvkk" target="_blank" className="text-indigo-300 underline underline-offset-2">
                  KVKK Aydınlatma Metni
                </Link>
                'nde bulabilirsin. Bu metin bilgilendirme amaçlıdır, onay gerektirmez.
              </p>

              <div className="border-t border-zinc-800 pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-indigo-500"
                  />
                  <span className="text-xs text-zinc-300 leading-relaxed">
                    Yenilikler ve kampanyalar hakkında e-posta almak istiyorum.{" "}
                    <span className="text-zinc-500">(İsteğe bağlı, istediğin zaman geri alabilirsin)</span>
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {!legalOnly && (
                <button type="button" onClick={() => setStep(3)} className={backBtn}>Geri</button>
              )}
              <button disabled={!termsAccepted || loading} onClick={handleFinish} className={primaryBtn}>
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : legalOnly ? (
                  "Onayla ve Devam Et"
                ) : (
                  "Kurulumu Tamamla"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
