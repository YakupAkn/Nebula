"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile (captcha) bileşeni. Ek paket gerektirmez.
 *
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY tanımlı değilse hiçbir şey çizmez ve
 * TURNSTILE_ENABLED false olur. Böylece yerel geliştirmede, Supabase'de
 * captcha kapalıyken giriş eskisi gibi çalışır.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile betiği yüklenemedi"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

type Props = {
  /** Doğrulama bitince token, süresi dolunca ya da hata olunca null döner. */
  onToken: (token: string | null) => void;
};

export default function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_ENABLED) return;

    let cancelled = false;
    let widgetId: string | undefined;

    loadTurnstileScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.turnstile) return;

        widgetId = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          // Şüpheli bir durum yoksa kutu hiç görünmez.
          appearance: "interaction-only",
          callback: (token: string) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            setFailed(true);
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, []);

  if (!TURNSTILE_ENABLED) return null;

  return (
    <div>
      <div ref={containerRef} className="flex justify-center" />
      {failed && (
        <p className="text-[11px] text-amber-400/90 text-center leading-relaxed">
          Güvenlik doğrulaması yüklenemedi. Reklam engelleyiciyi kapatıp sayfayı yenile.
        </p>
      )}
    </div>
  );
}
