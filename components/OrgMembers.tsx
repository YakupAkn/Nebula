"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface OrgMembersProps {
  organizationId: string;
  onClose: () => void;
}

export function OrgMembers({ organizationId, onClose }: OrgMembersProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found" | "error">("idle");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    const { data: users, error: searchError } = await supabase.rpc("find_user_by_email", {
      search_email: email.trim(),
    });

    if (searchError || !users || users.length === 0) {
      setStatus("not_found");
      return;
    }

    const foundUser = users[0];

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert([{ organization_id: organizationId, user_id: foundUser.id, role: "member" }]);

    if (insertError) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-slate-900">Üye Ekle</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddMember} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ekip.arkadasi@mail.com"
              autoFocus
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Eklenecek kişinin Nebula'ya bu e-posta ile en az bir kez giriş yapmış olması gerekir.
            </p>
          </div>

          {status === "not_found" && (
            <p className="text-xs text-rose-600 font-medium">
              Bu e-posta ile kayıtlı bir kullanıcı bulunamadı. Önce kişinin giriş yapması gerekiyor.
            </p>
          )}
          {status === "error" && (
            <p className="text-xs text-rose-600 font-medium">
              Ekleme başarısız oldu — zaten üye olabilir.
            </p>
          )}
          {status === "success" && (
            <p className="text-xs text-emerald-600 font-medium">Üye eklendi.</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            {status === "loading" ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}