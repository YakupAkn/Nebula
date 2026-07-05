"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface Project {
  id: string;
  name: string;
}

interface OrgMember {
  user_id: string;
  email: string;
}

interface ProjectSetupProps {
  session: Session;
  organizationId: string;
  onProjectSelected: (projectId: string) => void;
}

export function ProjectSetup({ session, organizationId, onProjectSelected }: ProjectSetupProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([session.user.id]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const fetchOrgMembers = async () => {
    const { data: memberRows } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId);

    if (!memberRows || memberRows.length === 0) {
      setOrgMembers([]);
      return;
    }

    const userIds = memberRows.map((m: any) => m.user_id);

    const { data: users, error } = await supabase.rpc("get_users_by_ids", {
      user_ids: userIds,
    });

    if (!error && users) {
      setOrgMembers(users.map((u: any) => ({ user_id: u.id, email: u.email })));
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchOrgMembers();
  }, [organizationId]);

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setStatus("loading");

    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert([{ name: projectName, organization_id: organizationId, created_by: session.user.id }])
      .select()
      .single();

    if (projError || !project) {
      setStatus("error");
      return;
    }

    const memberIds = Array.from(new Set([...selectedMemberIds, session.user.id]));

    const { error: memberError } = await supabase
      .from("project_members")
      .insert(memberIds.map((userId) => ({ project_id: project.id, user_id: userId })));

    if (memberError) {
      setStatus("error");
      return;
    }

    onProjectSelected(project.id);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nebula</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Bir proje seç ya da yeni oluştur.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {mode === "list" && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">Henüz bir proje yok.</p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onProjectSelected(p.id)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-sm font-medium text-slate-800"
                  >
                    {p.name}
                  </button>
                ))
              )}

              <button
                onClick={() => setMode("create")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all mt-3"
              >
                Yeni Proje Oluştur
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Proje Adı
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="ör. TerraGuard"
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Projeye Dahil Olacaklar
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {orgMembers.map((member) => (
                    <label
                      key={member.user_id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.user_id)}
                        onChange={() => toggleMember(member.user_id)}
                        disabled={member.user_id === session.user.id}
                        className="accent-indigo-600"
                      />
                      {member.user_id === session.user.id ? "Sen" : member.email}
                    </label>
                  ))}
                </div>
              </div>

              {status === "error" && (
                <p className="text-xs text-rose-600 font-medium">Bir şeyler ters gitti, tekrar dene.</p>
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
                onClick={() => setMode("list")}
                className="w-full text-xs text-slate-400 font-semibold hover:text-slate-600"
              >
                Geri
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}