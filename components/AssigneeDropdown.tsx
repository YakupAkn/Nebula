"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { maskEmail, getInitials } from "@/utils/user";

interface MemberProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string; // Gösterim için mock veya ilişkili tablodan gelen email
}

interface AssigneeDropdownProps {
  organizationId: string;
  currentAssigneeId: string | null;
  onAssign: (userId: string | null) => void;
}

export default function AssigneeDropdown({ organizationId, currentAssigneeId, onAssign }: AssigneeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dışarı tıklanınca kapatma işlevi
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchOrganizationMembers();
  }, [organizationId, currentAssigneeId]);

  const fetchOrganizationMembers = async () => {
    try {
      setLoading(true);
      // Organizasyona bağlı üyelerin profil bilgilerini çekiyoruz
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          user_id,
          profiles:user_id (id, full_name, avatar_url)
        `)
        .eq("organization_id", organizationId);

      if (error) throw error;

      const formattedMembers: MemberProfile[] = (data || []).map((m: any) => ({
        id: m.profiles?.id,
        full_name: m.profiles?.full_name || "Bilinmeyen Üye",
        avatar_url: m.profiles?.avatar_url,
        email: "user" + m.user_id.slice(0, 3) + "@company.com" // Projenizdeki gerçek email alanıyla değiştirilebilir
      }));

      setMembers(formattedMembers);

      if (currentAssigneeId) {
        const current = formattedMembers.find(m => m.id === currentAssigneeId);
        if (current) setSelectedMember(current);
      } else {
        setSelectedMember(null);
      }
    } catch (err) {
      console.error("Üyeler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (member: MemberProfile | null) => {
    setSelectedMember(member);
    onAssign(member ? member.id : null);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-1.5">
        Görevli
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#0d0d12] border border-zinc-800 rounded-lg text-sm text-zinc-200 hover:border-zinc-700 transition-colors focus:outline-none"
      >
        {selectedMember ? (
          <div className="flex items-center gap-2 text-left">
            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300">
              {selectedMember.avatar_url ? (
                <img src={selectedMember.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(selectedMember.full_name)
              )}
            </div>
            <span className="font-medium text-zinc-200 truncate">{selectedMember.full_name}</span>
          </div>
        ) : (
          <span className="text-zinc-500">Atanmamış</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-[#0d0d12] border border-zinc-800 rounded-xl shadow-2xl z-50 py-1 max-h-60 overflow-y-auto backdrop-blur-xl">
          {/* Atamayı Kaldır Seçeneği */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full flex items-center px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300 text-left transition-colors"
          >
            Atamayı Kaldır
          </button>
          
          <div className="h-[1px] bg-zinc-800/60 my-1" />

          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-900/80 text-left transition-colors group border-b border-zinc-900/40 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(member.full_name)
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                  {member.full_name}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {maskEmail(member.email || "")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}