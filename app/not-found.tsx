"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StarBackground from "@/components/StarBackground";

export default function NotFound() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#020208] text-slate-100">
      <StarBackground />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-16 sm:px-6">
        {/* Panele özel, hafif indigo/mor glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]"
        />

        <section
          className={`relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center shadow-[0_0_60px_-20px_rgba(99,102,241,0.4)] backdrop-blur-xl transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none sm:px-10 sm:py-12 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {/* Arka planda dev, soluk 404 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-[7rem] font-bold leading-none text-white/[0.05] sm:text-[9rem]"
          >
            404
          </span>

          <div className="relative">
            <span className="block text-xs font-medium tracking-[0.35em] text-indigo-300/80">
              404
            </span>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Sayfa Uzayda
            </h1>

            <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-slate-400 sm:text-base">
              Aradığın sayfa Nebula&apos;dan ayrılmış ve bilinmeyen bir yörüngeye girmiş
              olabilir.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-colors duration-200 hover:from-indigo-400 hover:to-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020208] sm:w-auto"
              >
                Nebula&apos;ya Dön
              </Link>

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020208] sm:w-auto"
              >
                Geri Git
              </button>
            </div>

            <Link
              href="/nebula"
              className="mt-6 inline-block text-xs font-medium text-slate-500 transition-colors hover:text-indigo-300"
            >
              Nebula nedir?
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}