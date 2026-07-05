"use client";
import { useState, useEffect } from "react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "../components/Column";
import { TaskModal } from "../components/TaskModal";
import { supabase } from "@/lib/supabase";

const COLUMNS = ["Yapılacaklar", "Devam Edenler", "Tamamlananlar"];

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
  description: string | null;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Yazılım");
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Seçili kart detayını tutan yeni state yapısı
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setTasks(data.map((t: any) => ({ ...t, id: t.id.toString() })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("realtime-tasks")
      .on(
        "postgres_changes",
        { event: "*", scheme: "public", table: "tasks" },
        () => {
          fetchTasks(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsFormOpen(false);

    await supabase.from("tasks").insert([
      { title: newTitle, status: "Yapılacaklar", tag: newTag, description: "" },
    ]);
    setNewTitle("");
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", parseInt(id));
    if (error) fetchTasks();
  };

  // Açıklama alanını veritabanında güncelleyen fonksiyon
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

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    let updatedStatus = "";

    setTasks((prevTasks) => {
      const activeIndex = prevTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prevTasks;

      const newTasks = [...prevTasks];

      if (COLUMNS.includes(overId)) {
        updatedStatus = overId;
        newTasks[activeIndex].status = overId;
        return newTasks;
      }

      const overIndex = prevTasks.findIndex((t) => t.id === overId);
      if (overIndex !== -1) {
        updatedStatus = newTasks[overIndex].status;
        newTasks[activeIndex].status = updatedStatus;
        return arrayMove(newTasks, activeIndex, overIndex);
      }

      return prevTasks;
    });

    if (updatedStatus) {
      await supabase
        .from("tasks")
        .update({ status: updatedStatus })
        .eq("id", parseInt(activeId));
    }
  };

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
            {isFormOpen && (
              <form 
                onSubmit={handleAddTask} 
                className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95"
              >
                <input
                  type="text"
                  placeholder="Yapılacak bir iş yazın..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-4 py-2 text-sm bg-slate-50/50 rounded-lg focus:outline-none w-60 text-slate-800 border border-slate-200 focus:border-indigo-500"
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
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                >
                  Görev Oluştur
                </button>
              </form>
            )}

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

        {/* Detay Modalı Koşullu Render Yapısı */}
        {selectedTask && (
          <TaskModal 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
            onUpdate={handleUpdateDescription}
          />
        )}
      </main>
    </DndContext>
  );
}