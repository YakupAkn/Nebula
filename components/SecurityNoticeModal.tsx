"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import notices from "@/security/notices.json";

interface TimelineStep {
  durum: string;
  etiket: string;
  zaman: string;
}

interface Notice {
  id: string;
  version: string;
  severity: string;
  baslik: string;
  ozet: string;
  etki: string;
  cozum: string;
  zaman_cizelgesi: TimelineStep[];
}

const SEVERITY_LABEL: Record<string, string> = {
  yuksek: "Yüksek",
  orta: "Orta",
  dusuk: "Düşük",
};

function formatZaman(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SecurityNoticeModal({ userId }: { userId: string }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [catchUp, setCatchUp] = useState<string[]>([]);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allNotices = notices as Notice[];
      if (allNotices.length === 0) return;

      const { data: reads } = await supabase
        .from("security_notice_reads")
        .select("notice_id")
        .eq("user_id", userId);

      const readIds = new Set((reads ?? []).map((r) => r.notice_id));
      const unread = allNotices.filter((n) => !readIds.has(n.id));
      if (unread.length === 0 || cancelled) return;

      // Birden fazla okunmamış varsa sadece en sonuncusu gösterilir,
      // öncekiler sessizce okunmuş sayılır.
      const latest = unread[unread.length - 1];
      setCatchUp(unread.slice(0, -1).map((n) => n.id));
      setNotice(latest);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!notice) return null;

  const handleDismiss = async () => {
    setDismissing(true);
    const toMark = [...catchUp, notice.id];
    await supabase
      .from("security_notice_reads")
      .insert(toMark.map((notice_id) => ({ user_id: userId, notice_id })));
    setNotice(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-[#0a0e14] shadow-2xl shadow-emerald-500/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-400 tracking-wider">
              GÜVENLİK YAMASI
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/40">{notice.version}</span>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {SEVERITY_LABEL[notice.severity] ?? notice.severity}
              </span>
            </div>
            <h2 className="text-white text-sm font-semibold leading-snug">{notice.baslik}</h2>
          </div>

          <p className="text-white/60 text-xs leading-relaxed">{notice.ozet}</p>

          <div className="text-xs text-white/60 leading-relaxed">
            <span className="text-white/40">Çözüm: </span>
            {notice.cozum}
          </div>

          <div className="pt-1">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">
              Zaman Çizelgesi
            </div>
            <div className="space-y-0">
              {notice.zaman_cizelgesi.map((step, i) => (
                <div key={step.durum} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    {i < notice.zaman_cizelgesi.length - 1 && (
                      <span className="w-px flex-1 bg-white/10 my-0.5" />
                    )}
                  </div>
                  <div className="pb-3">
                    <div className="text-xs text-white/80 font-medium">{step.etiket}</div>
                    <div className="text-[11px] font-mono text-white/30">
                      {formatZaman(step.zaman)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/5">
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
          >
            {dismissing ? "Kaydediliyor…" : "Anladım"}
          </button>
        </div>
      </div>
    </div>
  );
}
