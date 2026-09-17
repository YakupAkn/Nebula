"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ProfileDropdownProps {
  fullName: string | null;
  email: string | null;
  onLogout: () => void;
}

function getInitial(name: string | null, email: string | null) {
  if (name && name.trim()) return name.trim().charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

export function ProfileDropdown({ fullName, email, onLogout }: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = fullName || email?.split("@")[0] || "Kullanıcı";

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  const handlePricingClick = () => {
    setIsOpen(false);
    router.push("/pricing");
  };

  const handleAboutClick = () => {
    setIsOpen(false);
    router.push("/nebula");
  };

  const handleSignOutClick = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    onLogout();
    router.push("/");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
      >
        <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {getInitial(fullName, email)}
        </span>
        <span className="hidden md:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">
          {displayName}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 hidden md:block">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
          <div className="px-3.5 py-2.5">
            <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{email}</p>
          </div>

          <div className="h-px bg-slate-100" />

          <button
            type="button"
            onClick={handleProfileClick}
            className="w-full text-left px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Profil
          </button>
          <button
            type="button"
            onClick={handleSettingsClick}
            className="w-full text-left px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Ayarlar
          </button>

          <div className="h-px bg-slate-100 my-1" />

          <button
            type="button"
            onClick={handlePricingClick}
            className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            Planını yükselt
          </button>

          <button
            type="button"
            onClick={handleAboutClick}
            className="w-full text-left px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            About Nebula
          </button>

          <div className="h-px bg-slate-100 my-1" />

          <button
            type="button"
            onClick={handleSignOutClick}
            className="w-full text-left px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
