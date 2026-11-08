import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
          ← Nebula'ya dön
        </Link>
        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-xs text-slate-400">Son güncelleme: {LEGAL.lastUpdated}</p>
          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">{children}</div>
        </article>
        <p className="mt-4 text-center text-xs text-slate-400">
          <Link href="/kullanim-sartlari" className="hover:text-slate-700 underline">Kullanım Şartları</Link>
          {" · "}
          <Link href="/kvkk" className="hover:text-slate-700 underline">KVKK Aydınlatma Metni</Link>
        </p>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
