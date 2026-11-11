"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export async function signOutAndGoHome() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

interface SetupTopBarProps {
  email: string | null | undefined;
}

export function SetupTopBar({ email }: SetupTopBarProps) {
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    await signOutAndGoHome();
  };

  return (
    <div className="absolute top-0 inset-x-0 flex items-center justify-end gap-3 px-4 py-3 sm:px-6 sm:py-4">
      {email && (
        <span className="hidden sm:block text-xs text-slate-400 font-medium truncate max-w-[220px]">
          {email}
        </span>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-all"
      >
        {busy ? "Çıkılıyor..." : "Çıkış Yap"}
      </button>
    </div>
  );
}
