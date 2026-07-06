"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/utils/user";

interface TaskCardMemberProps {
  assigneeId: string | null;
}

export default function TaskCardMember({ assigneeId }: TaskCardMemberProps) {
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assigneeId) {
      setProfile(null);
      return;
    }

    const fetchAssigneeProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", assigneeId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchAssigneeProfile();
  }, [assigneeId]);

  if (!assigneeId || loading) {
    return (
      <div className="flex items-center gap-1.5 opacity-40">
        <div className="w-5 h-5 rounded-full border border-dashed border-zinc-700 bg-transparent" />
        <span className="text-[11px] text-zinc-500">Atanmamış</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800/60 rounded-full pl-1 pr-2.5 py-0.5 max-w-max select-none">
      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300 shrink-0 shadow-inner">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(profile?.full_name || "Kullanıcı")
        )}
      </div>
      <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[100px]">
        {profile?.full_name || "Yükleniyor..."}
      </span>
    </div>
  );
}