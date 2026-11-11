"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Projeler" },
  { href: "/members", label: "Üyeler" },
  { href: "/profile", label: "Profil" },
  { href: "/settings", label: "Ayarlar" },
] as const;

export function DashboardLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m7.5-7.5L3 12m7.5 0h10.5" />
      </svg>
      Dashboard
    </Link>
  );
}

interface AppHeaderProps {
  /** Sağ taraftaki eylemler. Verilmezse Dashboard bağlantısı gösterilir. */
  actions?: ReactNode;
  /** İçerik genişliği sınıfı, sayfanın main genişliğiyle eşleşmeli. */
  maxWidth?: string;
}

export function AppHeader({ actions, maxWidth = "max-w-6xl" }: AppHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const rightActions = actions ?? <DashboardLink />;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const linkClass = (href: string, mobile: boolean) =>
    [
      mobile ? "block px-3 py-3 text-base" : "px-3 py-2 text-sm",
      "font-medium rounded-md transition",
      isCurrent(href)
        ? "text-indigo-700 bg-indigo-50"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    ].join(" ");

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between`}>
        <div className="flex items-center space-x-6">
          <Link href="/" aria-label="Nebula ana sayfa" className="flex items-center space-x-2 text-slate-900 font-bold text-lg rounded-md">
            <span aria-hidden="true" className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
              N
            </span>
            <span>Nebula</span>
          </Link>
          <nav aria-label="Ana menü" className="hidden md:flex space-x-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={linkClass(item.href, false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">{rightActions}</div>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-200 bg-white">
          <nav aria-label="Mobil menü" className={`${maxWidth} mx-auto px-4 sm:px-6 py-2 flex flex-col gap-1`}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={linkClass(item.href, true)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={`${maxWidth} mx-auto px-4 pb-3 flex flex-wrap items-center gap-2 sm:hidden`}>{rightActions}</div>
        </div>
      )}
    </header>
  );
}
