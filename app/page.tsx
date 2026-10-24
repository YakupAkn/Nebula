"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Column } from "../components/Column";
import { TaskModal } from "../components/TaskModal";
import { NewTaskModal } from "../components/NewTaskModal";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { OrgSetup } from "../components/OrgSetup";
import { ProjectSetup } from "../components/ProjectSetup";
import { OrgMembers } from "../components/OrgMembers";
import { Login } from "../components/Login";
import { WelcomeOnboarding } from "../components/WelcomeOnboarding";
import { AppTour } from "../components/AppTour";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase";
import {
  useHashRoute,
  navigate,
  closeOverlay,
  readLastProject,
  writeLastProject,
  readAuthErrorFromUrl,
  clearAuthErrorFromUrl,
  type RouteModal,
} from "@/lib/hash-route";
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
  priority: string;
}

interface SupabaseTask extends Omit<Task, "id"> {
  id: string | number;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgCheckLoading, setOrgCheckLoading] = useState(true);
  // Adres çubuğundaki hash (#pano/<proje> vb.) uygulamanın tek doğru kaynağı
  const route = useHashRoute();
  const [validProjectId, setValidProjectId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const projectId =
    route.view === "pano" && route.projectId && route.projectId === validProjectId
      ? route.projectId
      : null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTag, setNewTag] = useState("Yazılım");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [orgMembers, setOrgMembers] = useState<string[]>([]);
  const [currentUserFullName, setCurrentUserFullName] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isFormOpen = route.modal === "yeni-gorev";
  const showOrgMembers = route.modal === "uyeler";
  const selectedTask = route.taskId
    ? tasks.find((t) => t.id === route.taskId) ?? null
    : null;

  const openOverlay = (modal: RouteModal) =>
    navigate({ view: "pano", projectId, modal }, { overlay: true });
  const openTask = (task: Task) =>
    navigate({ view: "pano", projectId, taskId: task.id }, { overlay: true });
  const closeCurrentOverlay = () => closeOverlay(route);

  const handleProjectSelected = (id: string) => {
    setValidProjectId(id);
    writeLastProject(id);
    navigate({ view: "pano", projectId: id });
  };

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
      // Google/magic link hata dönüşünü okunur mesaja çevir, adresi temizle
      const message = readAuthErrorFromUrl();
      if (message) {
        setAuthError(message);
        clearAuthErrorFromUrl("#giris");
      }
      setSession(session);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          // Oturum kapanınca eski kullanıcıya ait durumu sıfırla
          setOrganizationId(null);
          setValidProjectId(null);
          setOrgCheckLoading(true);
        }
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
    if (!session) {
      setUserId(null);
      setShowOnboarding(false);
      setShowTour(false);
      setCurrentUserFullName(null);
      return;
    }

    const checkOnboardingStatus = async () => {
      setUserId(session.user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!error && profile && !profile.onboarding_completed) {
        setShowOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, [session]);

  useEffect(() => {
    if (!session) {
      setCurrentUserFullName(null);
      return;
    }

    const fetchOwnProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (!error && data) {
        setCurrentUserFullName(data.full_name);
      }
    };

    fetchOwnProfile();
  }, [session]);

  useEffect(() => {
    if (!organizationId) {
      setOrgMembers([]);
      return;
    }

    const fetchOrgMembers = async () => {
      try {
        const { data: memberRows, error } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId);

      if (error) {
        console.error(error);
        return;
      }

      const userIds = memberRows.map((m: any) => m.user_id);

      const { data: users, error: usersError } = await supabase.rpc(
        "get_users_by_ids",
        {
          user_ids: userIds,
        }
      );

      if (usersError) {
        console.error(usersError);
        return;
      }

      setOrgMembers(users.map((u: any) => u.email));
      } catch (err: any) {
        // Beklenmeyen JavaScript hataları için
        console.error("Beklenmeyen Hata:", err?.message || err);
      }
    };

    fetchOrgMembers();
  }, [organizationId]);

  useEffect(() => {
    if (!session || !organizationId || !projectId) return;

    setTasks([]);
    setLoading(true);
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

  // Durum -> adres: kullanıcıyı doğru hash'e yönlendir
  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      if (route.view !== "ana" && route.view !== "giris") {
        navigate({ view: "giris" }, { replace: true });
      }
      return;
    }

    if (orgCheckLoading) return;

    if (!organizationId) {
      if (route.view !== "organizasyon") {
        navigate({ view: "organizasyon" }, { replace: true });
      }
      return;
    }

    if (route.view === "projeler") return;
    if (route.view === "pano" && route.projectId) return;

    const last = readLastProject();
    navigate(
      last ? { view: "pano", projectId: last } : { view: "projeler" },
      { replace: true }
    );
  }, [authLoading, session, orgCheckLoading, organizationId, route.view, route.projectId]);

  // Adresteki proje gerçekten bu organizasyona ait mi?
  useEffect(() => {
    if (!session || !organizationId || route.view !== "pano" || !route.projectId) return;
    const target = route.projectId;
    if (validProjectId === target) return;

    let cancelled = false;
    supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", target)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data && data.organization_id === organizationId) {
          setValidProjectId(target);
          writeLastProject(target);
        } else {
          writeLastProject(null);
          navigate({ view: "projeler" }, { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, organizationId, route.view, route.projectId, validProjectId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    closeCurrentOverlay();

    const columnTasks = tasks.filter((t) => t.status === "Yapılacaklar");
    const maxPosition = columnTasks.length > 0
      ? Math.max(...columnTasks.map((t) => t.position))
      : 0;

    await supabase.from("tasks").insert([
      {
        title: newTitle,
        status: "Yapılacaklar",
        tag: newTag,
        description: newDescription || "",
        position: maxPosition + 1000,
        assignee: newAssignee || session?.user?.email || null,
        due_date: newDueDate || null,
        priority: newPriority,
        project_id: projectId,
      },
    ]);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setNewPriority("Medium");
    setNewAssignee("");
    setNewTag("Yazılım");
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) fetchTasks();
  };

  const handleUpdateDescription = async (id: string, description: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, description } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ description })
      .eq("id", id);

    if (error) fetchTasks();
  };

  const handleUpdateMeta = async (
    id: string,
    updates: { due_date?: string | null; assignee?: string | null; priority?: string }
  ) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id);

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
      .eq("id", activeId);
  };

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    if (route.view === "ana") {
      return <LandingPageWithoutSSR onStart={() => navigate({ view: "giris" })} />;
    }

    return <Login initialError={authError ?? undefined} />;
  }

  if (orgCheckLoading) {
    return <DashboardSkeleton />;
  }

  if (!organizationId) {
    return (
      <OrgSetup
        session={session}
        onOrgCreated={() => checkOrganization(session.user.id)}
      />
    );
  }

  if (route.view === "projeler") {
    return (
      <ProjectSetup
        session={session}
        organizationId={organizationId}
        onProjectSelected={handleProjectSelected}
      />
    );
  }

  // Yönlendirme ya da proje doğrulaması sürerken iskelet göster
  if (!projectId || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      {showOnboarding && userId && (
        <WelcomeOnboarding
          userId={userId}
          onComplete={() => {
            setShowOnboarding(false);
            setShowTour(true);
          }}
        />
      )}

      {showTour && <AppTour onTourEnd={() => setShowTour(false)} />}

      <div className="min-h-screen bg-[#fafafa] font-sans">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 md:h-[72px] flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Nebula
                </h1>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Canlı
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 font-medium mt-0.5 truncate">
                Görevlerinizi tek yerde yönetin.
              </p>
            </div>

            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <button
                onClick={() => navigate({ view: "projeler" })}
                className="hidden sm:inline-flex text-xs text-slate-500 hover:text-indigo-600 font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all"
                title="Proje Değiştir"
              >
                Projeler
              </button>
              <button
                onClick={() => openOverlay("uyeler")}
                className="hidden sm:inline-flex text-xs text-slate-500 hover:text-indigo-600 font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all"
                title="Üye Ekle"
              >
                Üyeler
              </button>

              <ProfileDropdown
                fullName={currentUserFullName}
                email={session.user.email ?? null}
                onLogout={handleLogout}
              />

              <button
                type="button"
                onClick={() => openOverlay("yeni-gorev")}
                className="bg-slate-900 hover:bg-slate-800 text-white w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm transition-all ml-1"
                title="Yeni Görev"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobilde Projeler / Üyeler erişimi */}
          <div className="sm:hidden flex items-center gap-2 px-4 pb-3">
            <button
              onClick={() => navigate({ view: "projeler" })}
              className="text-xs text-slate-500 hover:text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all border border-slate-200"
            >
              Projeler
            </button>
            <button
              onClick={() => openOverlay("uyeler")}
              className="text-xs text-slate-500 hover:text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all border border-slate-200"
            >
              Üyeler
            </button>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((colTitle) => (
              <Column
                key={colTitle}
                title={colTitle}
                tasks={tasks.filter((t) => t.status === colTitle)}
                onDeleteTask={handleDeleteTask}
                onTaskClick={openTask}
              />
            ))}
          </div>

          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={() => {
                setShowOnboarding(true);
                setShowTour(false);
              }}
              className="fixed bottom-4 right-4 z-50 bg-indigo-600/80 hover:bg-indigo-500 text-white text-[11px] font-mono px-3 py-1.5 rounded-lg backdrop-blur-md border border-indigo-400/30"
            >
              🧪 Test Onboarding
            </button>
          )}

          {selectedTask && (
            <TaskModal
              task={selectedTask}
              onClose={closeCurrentOverlay}
              onUpdate={handleUpdateDescription}
              onUpdateMeta={handleUpdateMeta}
              orgMembers={orgMembers}
            />
          )}

          {showOrgMembers && organizationId && (
            <OrgMembers
              organizationId={organizationId}
              onClose={closeCurrentOverlay}
            />
          )}

          <NewTaskModal
            open={isFormOpen}
            onClose={closeCurrentOverlay}
            onSubmit={handleAddTask}
            title={newTitle}
            onTitleChange={setNewTitle}
            description={newDescription}
            onDescriptionChange={setNewDescription}
            tag={newTag}
            onTagChange={setNewTag}
            assignee={newAssignee}
            onAssigneeChange={setNewAssignee}
            priority={newPriority}
            onPriorityChange={setNewPriority}
            dueDate={newDueDate}
            onDueDateChange={setNewDueDate}
            orgMembers={orgMembers}
            currentUserEmail={session.user.email ?? null}
          />
        </main>

      </div>
    </DndContext>
  );
}