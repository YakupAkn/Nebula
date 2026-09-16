"use client";
import { useState } from "react";

interface TourProps {
  onTourEnd: () => void;
}

export function AppTour({ onTourEnd }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Nebula'ya Hoş Geldin! 👋",
      desc: "İşte hızlıca oryantasyon olman için birkaç temel alan.",
      targetText: "Genel Bakış",
    },
    {
      title: "1. Görev Akışı (Kanban)",
      desc: "Ekibinin tüm görevlerini sürükle-bırak kartlarla buradan takip edebilirsin.",
      targetText: "Proje Panosu",
    },
    {
      title: "2. Takım Yönetimi",
      desc: "Takım arkadaşlarını davet edebilir ve görev atamaları yapabilirsin.",
      targetText: "Ekip Üyeleri",
    },
    {
      title: "Hazırsın! 🚀",
      desc: "Her şey ayarlandı. Hemen ilk görevini oluşturarak başlayabilirsin.",
      targetText: "Başlayalım",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onTourEnd();
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10 text-center animate-in zoom-in-95 duration-200">
        
        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400 font-bold text-sm">
          {currentStep + 1}/{steps.length}
        </div>

        <h3 className="text-base font-semibold text-zinc-100">{steps[currentStep].title}</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed mb-6">
          {steps[currentStep].desc}
        </p>

        <div className="flex gap-2">
          {currentStep < steps.length - 1 && (
            <button
              onClick={onTourEnd}
              className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
            >
              Turu Atla
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            {currentStep === steps.length - 1 ? "Başla" : "Sonraki"}
          </button>
        </div>
      </div>
    </div>
  );
}