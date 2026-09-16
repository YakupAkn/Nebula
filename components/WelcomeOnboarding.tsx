"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

export function WelcomeOnboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [teamSize, setTeamSize] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [loading, setLoading] = useState(false);

  const teamOptions = [
    { id: "1", label: "Sadece Ben", desc: "Kişisel projeler için" },
    { id: "2-5", label: "2 - 5 Kişi", desc: "Küçük çekirdek ekip" },
    { id: "6-20", label: "6 - 20 Kişi", desc: "Büyüyen takım" },
    { id: "20+", label: "20+ Kişi", desc: "Geniş organizasyon" },
  ];

  const referralOptions = [
    "Google / Arama Motoru",
    "LinkedIn / X (Twitter)",
    "Arkadaş / Tavsiye",
    "Topluluk / Forum",
    "Diğer",
  ];

  const handleFinish = async () => {
    if (!referralSource) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        team_size: teamSize,
        referral_source: referralSource,
        onboarding_completed: true,
      })
      .eq("id", userId);

    setLoading(false);
    if (!error) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-zinc-950/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/30">
        
        {/* İlerleme Çubuğu */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 w-full max-w-[120px]">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? "bg-indigo-500" : "bg-zinc-800"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? "bg-indigo-500" : "bg-zinc-800"}`} />
          </div>
          <span className="text-[11px] font-medium text-zinc-500">Adım {step} / 2</span>
        </div>

        {step === 1 ? (
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Takımınız kaç kişiden oluşuyor?</h2>
            <p className="text-xs text-zinc-400 mb-6">Deneyiminizi ekibinize göre özelleştireceğiz.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {teamOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTeamSize(item.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    teamSize === item.id
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>

            <button
              disabled={!teamSize}
              onClick={() => setStep(2)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Devam Et
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Nebula'yı nereden duydunuz?</h2>
            <p className="text-xs text-zinc-400 mb-6">Bize ulaşma kanalınızı bilmek gelişmemize yardımcı olur.</p>

            <div className="space-y-2 mb-6">
              {referralOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setReferralSource(option)}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    referralSource === option
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-xl border border-zinc-800"
              >
                Geri
              </button>
              <button
                disabled={!referralSource || loading}
                onClick={handleFinish}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Kurulumu Tamamla"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}