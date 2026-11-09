"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "loading" | "done" | "error";

function UnsubscribeCard() {
  const params = useSearchParams();
  const u = params.get("u") ?? "";
  const t = params.get("t") ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const invalid = !u || !t;

  const confirm = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u, t }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "İşlem tamamlanamadı.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setMessage("Bağlantı kurulamadı, tekrar dene.");
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
      <h1 className="text-xl font-bold text-slate-900 mb-2">E-posta aboneliği</h1>

      {invalid ? (
        <p className="text-sm text-slate-500">Bu bağlantı geçersiz görünüyor. E-postadaki bağlantıyı tekrar açmayı dene.</p>
      ) : status === "done" ? (
        <>
          <p className="text-sm text-slate-600 mb-1 font-medium">Aboneliğin iptal edildi.</p>
          <p className="text-sm text-slate-500">
            Artık Nebula&apos;dan yenilik ve kampanya e-postaları almayacaksın. Hesabınla ilgili önemli bildirimler
            (giriş bağlantısı gibi) yine gelebilir.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-6">
            Nebula&apos;dan yenilik ve kampanya e-postaları almayı bırakmak istediğini onayla.
          </p>
          {status === "error" && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl font-medium mb-4">
              {message}
            </div>
          )}
          <button
            onClick={confirm}
            disabled={status === "loading"}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
          >
            {status === "loading" ? "İptal ediliyor..." : "Abonelikten çık"}
          </button>
        </>
      )}

      <Link href="/" className="inline-block mt-6 text-xs text-indigo-600 hover:text-indigo-500 font-medium">
        Nebula&apos;ya dön
      </Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <UnsubscribeCard />
      </Suspense>
    </main>
  );
}
