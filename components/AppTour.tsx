"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface TourProps {
  onTourEnd: () => void;
}

interface TourStep {
  title: string;
  desc: string;
  /** Sayfadaki `data-tour="..."` değeri. Yoksa kart ekranın ortasında gösterilir. */
  target?: string;
  /** Küçük (buton gibi) hedeflerde tam daire, geniş alanlarda elips çizilir. */
  padding?: number;
}

const STEPS: TourStep[] = [
  {
    title: "Nebula'ya Hoş Geldin! 👋",
    desc: "İşte hızlıca oryantasyon olman için birkaç temel alan.",
  },
  {
    title: "1. Görev Akışı (Kanban)",
    desc: "Ekibinin tüm görevlerini sürükle-bırak kartlarla buradan takip edebilirsin.",
    target: "kanban",
    padding: 24,
  },
  {
    title: "2. Görev Ekle",
    desc: "Yeni bir görev oluşturmak için bu butonu kullan. Başlık, etiket, öncelik ve atanan kişiyi seçebilirsin.",
    target: "add-task",
    padding: 14,
  },
  {
    title: "3. Üye Ekle",
    desc: "Takım arkadaşlarını buradan davet edebilir ve görev atamaları yapabilirsin.",
    target: "members",
    padding: 16,
  },
  {
    title: "Hazırsın! 🚀",
    desc: "Her şey ayarlandı. Hemen ilk görevini oluşturarak başlayabilirsin.",
  },
];

const VIEWPORT_MARGIN = 16;
const CARD_MAX_WIDTH = 360;
const CARD_GAP = 20;

interface Spot {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** Aynı `data-tour` değerine sahip, ekranda gerçekten görünen ilk elemanı bulur (mobil/masaüstü kopyaları için). */
function findVisibleTarget(name: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of Array.from(nodes)) {
    const r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return node;
  }
  return null;
}

/** Hedefin görünür kısmına göre daire/elips ölçüsünü hesaplar. */
function measure(el: HTMLElement, padding: number): Spot {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = el.getBoundingClientRect();

  // Uzun alanlarda (Kanban) sadece ekranda görünen üst kısmı çerçevele
  const left = Math.max(r.left, 0);
  const right = Math.min(r.right, vw);
  const top = Math.max(r.top, 0);
  const bottom = Math.min(r.bottom, vh, top + vh * 0.6);

  const w = Math.max(right - left, 1);
  const h = Math.max(bottom - top, 1);
  const cx = left + w / 2;
  const cy = top + h / 2;

  // Küçük hedefler (butonlar): tam daire. Geniş hedefler: elips.
  const isSmall = w < 140 && h < 140;
  if (isSmall) {
    const d = Math.max(w, h) + padding * 2;
    return { cx, cy, w: d, h: d };
  }
  // Elips köşeleri kesmesin diye √2 ile genişlet
  return { cx, cy, w: w * 1.2 + padding, h: h * 1.2 + padding };
}

export function AppTour({ onTourEnd }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [cardHeight, setCardHeight] = useState(180);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const update = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    if (!step.target) {
      setSpot(null);
      return;
    }
    const el = findVisibleTarget(step.target);
    setSpot(el ? measure(el, step.padding ?? 12) : null);
  }, [step]);

  // Adım değişince hedefi görünür alana getir, sonra ölç
  useLayoutEffect(() => {
    if (step.target) {
      findVisibleTarget(step.target)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    update();
  }, [step, update]);

  // Boyut, kaydırma ve içerik değişimlerinde konumu güncelle
  useEffect(() => {
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    let observer: ResizeObserver | null = null;
    if (step.target && typeof ResizeObserver !== "undefined") {
      const el = findVisibleTarget(step.target);
      if (el) {
        observer = new ResizeObserver(update);
        observer.observe(el);
      }
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
    };
  }, [step, update]);

  // Kart yüksekliğini ölç (alt/üst yerleşim kararı için)
  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [currentStep, viewport.w]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onTourEnd();
    }
  };

  // Klavye: Esc = atla, ok tuşları/Enter = ilerle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTourEnd();
      else if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      else if (e.key === "ArrowLeft") setCurrentStep((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleBack = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  // Kart konumu: hedef varsa altında/üstünde, yoksa ortada. Yatayda ekran dışına taşmaz.
  const cardWidth = Math.min(CARD_MAX_WIDTH, Math.max(viewport.w - VIEWPORT_MARGIN * 2, 0));
  let cardStyle: React.CSSProperties;
  if (spot && viewport.w > 0) {
    const spotTop = spot.cy - spot.h / 2;
    const spotBottom = spot.cy + spot.h / 2;
    const spaceBelow = viewport.h - spotBottom;
    const spaceAbove = spotTop;
    const needed = cardHeight + CARD_GAP + VIEWPORT_MARGIN;

    let top: number;
    if (spaceBelow >= needed) top = spotBottom + CARD_GAP;
    else if (spaceAbove >= needed) top = spotTop - CARD_GAP - cardHeight;
    else top = Math.max(VIEWPORT_MARGIN, (viewport.h - cardHeight) / 2); // sığmıyorsa ortala (büyük alanlarda üstüne biner)

    const left = Math.min(
      Math.max(spot.cx - cardWidth / 2, VIEWPORT_MARGIN),
      Math.max(viewport.w - cardWidth - VIEWPORT_MARGIN, VIEWPORT_MARGIN)
    );
    cardStyle = { position: "fixed", top, left, width: cardWidth };
  } else {
    cardStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      width: cardWidth || CARD_MAX_WIDTH,
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto" role="dialog" aria-modal="true" aria-label="Uygulama turu">
      {/* Hedef yoksa tüm ekranı karart; varsa karartmayı daire/elips deliği olan gölge yapar */}
      {spot ? (
        <div
          aria-hidden
          className="absolute rounded-[50%] ring-2 ring-indigo-400 pointer-events-none"
          style={{
            left: spot.cx - spot.w / 2,
            top: spot.cy - spot.h / 2,
            width: spot.w,
            height: spot.h,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 28px 4px rgba(99, 102, 241, 0.55)",
            transition: "left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      )}

      <div
        ref={cardRef}
        style={{ ...cardStyle, transition: spot ? "top 300ms ease, left 300ms ease" : undefined }}
        className="bg-zinc-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10 text-center"
      >
        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400 font-bold text-sm">
          {currentStep + 1}/{STEPS.length}
        </div>

        <h3 className="text-base font-semibold text-zinc-100">{step.title}</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed mb-6">{step.desc}</p>

        <div className="flex gap-2">
          {!isLast && (
            <button
              onClick={onTourEnd}
              className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
            >
              Turu Atla
            </button>
          )}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
            >
              Geri
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            {isLast ? "Başla" : "Sonraki"}
          </button>
        </div>
      </div>
    </div>
  );
}
