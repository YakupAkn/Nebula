"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Column } from "../components/Column";
import { TaskModal } from "../components/TaskModal";
import { OrgSetup } from "../components/OrgSetup";
import { ProjectSetup } from "../components/ProjectSetup";
import { OrgMembers } from "../components/OrgMembers";
import { Login } from "../components/Login";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Vercel çökme hatasını önlemek için LandingPage'i SSR olmadan içeri aktarıyoruz
const LandingPageWithoutSSR = dynamic(() => import("../components/LandingPage"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-black" />
});

const COLUMNS = ["Yapılacaklar", "Devam Edenler", "Tamamlananlar"];

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
  description: string | null;
  position: number;
  due_date: string | null;
  assignee: string | null;
}

interface SupabaseTask extends Omit<Task, "id"> {
  id: string | number;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgCheckLoading, setOrgCheckLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showOrgMembers, setShowOrgMembers] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Yazılım");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgMembers, setOrgMembers] = useState<string[]>([]);
  const [showLanding, setShowLanding] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const fetchTasks = async () => {
    if (!projectId) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Görevler çekilirken hata oluştu:", error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setTasks((data as SupabaseTask[]).map((t) => ({ ...t, id: t.id.toString() })));
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkOrganization = async (userId: string) => {
    setOrgCheckLoading(true);
    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Organizasyon kontrolünde hata:", error.message);
    }

    if (data) {
      setOrganizationId(data.organization_id);
    } else {
      setOrganizationId(null);
    }
    setOrgCheckLoading(false);
  };

  useEffect(() => {
    if (session) {
      checkOrganization(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    if (!organizationId) {
      setOrgMembers([]);
      return;
    }

    const fetchOrgMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("organization_members")
          .select("user_email")
          .eq("organization_id", organizationId);

        // Hata varsa uygulamayı çökertmemek için throw yerine return kullanıyoruz
        if (error) {
          console.error("Supabase üye çekme hatası:", error.message || error);
          return;
        }

        if (data) {
          const memberEmails = data
            .map((member: { user_email: string | null }) => member.user_email)
            .filter((email): email is string => Boolean(email));

          setOrgMembers(memberEmails);
        }
      } catch (err: any) {
        // Beklenmeyen JavaScript hataları için
        console.error("Beklenmeyen Hata:", err?.message || err);
      }
    };

    fetchOrgMembers();
  }, [organizationId]);

  useEffect(() => {
    if (!session || !organizationId || !projectId) return;

    fetchTasks();

    const channel = supabase
      .channel(`realtime-tasks-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, organizationId, projectId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsFormOpen(false);

    const columnTasks = tasks.filter((t) => t.status === "Yapılacaklar");
    const maxPosition = columnTasks.length > 0
      ? Math.max(...columnTasks.map((t) => t.position))
      : 0;

    await supabase.from("tasks").insert([
      {
        title: newTitle,
        status: "Yapılacaklar",
        tag: newTag,
        description: "",
        position: maxPosition + 1000,
        assignee: newAssignee || session?.user?.email || null,
        due_date: newDueDate || null,
        project_id: projectId,
      },
    ]);
    setNewTitle("");
    setNewDueDate("");
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", parseInt(id));
    if (error) fetchTasks();
  };

  const handleUpdateDescription = async (id: string, description: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, description } : t))
    );

    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, description });
    }

    const { error } = await supabase
      .from("tasks")
      .update({ description })
      .eq("id", parseInt(id));

    if (error) fetchTasks();
  };

  const handleUpdateMeta = async (
    id: string,
    updates: { due_date?: string | null; assignee?: string | null }
  ) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, ...updates });
    }

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", parseInt(id));

    if (error) fetchTasks();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverColumn = COLUMNS.includes(overId);
    const targetStatus = isOverColumn
      ? overId
      : tasks.find((t) => t.id === overId)?.status;

    if (!targetStatus) return;

    const columnTasks = tasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;

    if (isOverColumn) {
      const maxPos = columnTasks.length > 0
        ? Math.max(...columnTasks.map((t) => t.position))
        : 0;
      newPosition = maxPos + 1000;
    } else {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);

      if (overIndex === -1) {
        const maxPos = columnTasks.length > 0
          ? Math.max(...columnTasks.map((t) => t.position))
          : 0;
        newPosition = maxPos + 1000;
      } else {
        const prevTask = columnTasks[overIndex - 1];
        const nextTask = columnTasks[overIndex];

        if (prevTask && nextTask) {
          newPosition = (prevTask.position + nextTask.position) / 2;
        } else if (!prevTask && nextTask) {
          newPosition = nextTask.position / 2;
        } else {
          newPosition = nextTask.position + 1000;
        }
      }
    }

    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === activeId
          ? { ...t, status: targetStatus, position: newPosition }
          : t
      )
    );

    await supabase
      .from("tasks")
      .update({ status: targetStatus, position: newPosition })
      .eq("id", parseInt(activeId));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (showLanding) {
      return <LandingPageWithoutSSR onStart={() => setShowLanding(false)} />;
    }

    return <Login />;
  }

  if (orgCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <OrgSetup
        session={session}
        onOrgCreated={() => checkOrganization(session.user.id)}
      />
    );
  }

  if (!projectId) {
    return (
      <ProjectSetup
        session={session}
        organizationId={organizationId}
        onProjectSelected={setProjectId}
      />
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <main className="p-8 md:p-12 bg-[#fafafa] min-h-screen font-sans">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 mb-8 border-b border-slate-200 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Nebula <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Canlı</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Ekip görev akışını eş zamanlı takip edin.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Form açık değilse bu butonları ve e-postayı göster */}
            {!isFormOpen && (
              <>
                <button
                  onClick={() => setProjectId(null)}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all"
                  title="Proje Değiştir"
                >
                  Projeler
                </button>
                <button
                  onClick={() => setShowOrgMembers(true)}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all"
                  title="Üye Ekle"
                >
                  Üye Ekle
                </button>
                <span className="hidden md:block text-xs text-slate-400 font-medium mr-1">
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-rose-600 font-semibold px-3 py-2 rounded-lg hover:bg-rose-50 transition-all"
                  title="Çıkış Yap"
                >
                  Çıkış Yap
                </button>
              </>
            )}

            {/* Form açıksa görev ekleme panelini göster */}
            {isFormOpen && (
              <form
                onSubmit={handleAddTask}
                className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95"
              >
                <input
                  type="text"
                  placeholder="Yapılacak bir iş yazın..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-4 py-2 text-sm bg-slate-50/50 rounded-lg focus:outline-none w-56 text-slate-800 border border-slate-200 focus:border-indigo-500"
                  autoFocus
                />
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
                >
                  <option value="Yazılım">Yazılım</option>
                  <option value="Donanım">Donanım</option>
                  <option value="Rapor">Rapor</option>
                </select>
                <select
                  value={newAssignee || session?.user.email || ""}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
                >
                  {orgMembers.length === 0 ? (
                    <option value={session?.user.email ?? ""}>{session?.user.email ?? "Ben"}</option>
                  ) : (
                    orgMembers.map((email) => (
                      <option key={email} value={email}>
                        {email.split("@")[0]}
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                >
                  Görev Oluştur
                </button>
              </form>
            )}

            {/* Formu açıp kapatan artı (+) butonu her zaman kalır */}
            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className={`bg-slate-900 hover:bg-slate-800 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
                isFormOpen ? "rotate-45 bg-rose-600 hover:bg-rose-500" : "rotate-0"
              }`}
              title="Yeni Görev"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Nebula Senkronize Ediliyor...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((colTitle) => (
              <Column
                key={colTitle}
                title={colTitle}
                tasks={tasks.filter((t) => t.status === colTitle)}
                onDeleteTask={handleDeleteTask}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>
        )}

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateDescription}
            onUpdateMeta={handleUpdateMeta}
            orgMembers={orgMembers}
          />
        )}

        {showOrgMembers && organizationId && (
          <OrgMembers
            organizationId={organizationId}
            onClose={() => setShowOrgMembers(false)}
          />
        )}
      </main>
    </DndContext>
  );
}