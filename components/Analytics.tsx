"use client";
import Link from "next/link";
import Script from "next/script";
import { useSyncExternalStore } from "react";

const KEY = "nebula:cookie-consent";
const EVENT = "nebula:cookie-consent-change";
const GA_ID = "G-X1BB1FB0MZ";

type Consent = "accepted" | "rejected" | null;

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Consent {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return "rejected";
  }
}

function choose(value: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* localStorage kapalı olabilir */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Google Analytics sadece kullanıcı izin verirse yüklenir (KVKK: zorunlu olmayan çerezler için açık rıza). */
export function Analytics() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => "rejected" as Consent);

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}

      {consent === null && (
        <div
          role="dialog"
          aria-label="Çerez tercihleri"
          className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:right-4"
        >
          <p className="text-xs leading-relaxed text-zinc-300">
            Giriş için gerekli çerezleri kullanırız. Ayrıca ürünü geliştirmek için analitik çerezleri (Google Analytics)
            kullanmak istiyoruz; bunlar yalnızca izin verirsen çalışır. Ayrıntılar için{" "}
            <Link href="/kvkk" className="text-indigo-300 underline underline-offset-2">
              KVKK Aydınlatma Metni
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => choose("rejected")}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Reddet
            </button>
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Kabul Et
            </button>
          </div>
        </div>
      )}
    </>
  );
}
