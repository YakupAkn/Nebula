"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface OrgSetupProps {
  session: Session;
  onOrgCreated: () => void;
}

export function OrgSetup({ session, onOrgCreated }: OrgSetupProps) {
  const [mode, setMode] = useState<"choice" | "create" | "waiting">("choice");
  const [orgName, setOrgName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert([{ name: orgName, created_by: session.user.id }])
      .select()
      .single();

    if (orgError || !org) {
      setStatus("error");
      setErrorMsg("Organizasyon oluşturulamadı, tekrar dene.");
      return;
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert([{ organization_id: org.id, user_id: session.user.id, role: "owner" }]);

    if (memberError) {
      setStatus("error");
      setErrorMsg("Üyelik oluşturulamadı, tekrar dene.");
      return;
    }

    onOrgCreated();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nebula</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {session.user.email}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {mode === "choice" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center mb-4">
                Henüz bir organizasyona ait değilsin.
              </p>
              <button
                onClick={() => setMode("create")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                Yeni Organizasyon Oluştur
              </button>
              <button
                onClick={() => setMode("waiting")}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all border border-slate-200"
              >
                Davet Bekliyorum
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Organizasyon Adı
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="ör. Deneyap Ekibi"
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                {status === "loading" ? "Oluşturuluyor..." : "Oluştur"}
              </button>
              <button
                type="button"
                onClick={() => setMode("choice")}
                className="w-full text-xs text-slate-400 font-semibold hover:text-slate-600"
              >
                Geri
              </button>
            </form>
          )}

          {mode === "waiting" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">Davet bekleniyor</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Organizasyon sahibinin seni <span className="font-medium">{session.user.email}</span> adresinle eklemesini bekle. Eklendiğinde sayfayı yenile.
              </p>
              <button
                onClick={() => setMode("choice")}
                className="text-xs text-indigo-600 font-semibold mt-4 hover:underline"
              >
                Geri
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}