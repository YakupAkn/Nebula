"use client";
import { useState, useEffect } from "react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "@/components/Column";
import { supabase } from "@/lib/supabase"; // Supabase bağlantımızı import ettik

const COLUMNS = ["Yapılacaklar", "Devam Edenler", "Tamamlananlar"];

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
}

export default function Home() {
  // Başlangıçta boş bir dizi ile başlıyoruz
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Yazılım");
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // 1. Supabase'den Görevleri Çekme Fonksiyonu
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Supabase'deki id'ler sayı (bigint) gelebilir, dnd-kit string beklediği için string'e çeviriyoruz
      const formattedTasks = (data || []).map((task: any) => ({
        ...task,
        id: task.id.toString(),
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Görevler yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk açıldığında verileri çek
  useEffect(() => {
    fetchTasks();
  }, []);

  // 2. Supabase'e Yeni Görev Ekleme Fonksiyonu
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTitle,
            status: "Yapılacaklar",
            tag: newTag,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newTask = {
          ...data[0],
          id: data[0].id.toString(),
        };
        setTasks([...tasks, newTask]);
      }
      
      setNewTitle("");
    } catch (error) {
      console.error("Görev eklenirken hata oluştu:", error);
    }
  };

  // 3. Sürükle Bırak Bittiğinde Supabase'i Güncelleme Fonksiyonu
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Arayüzün donmaması için önce yerel state'i (UI) anında güncelleyelim (Optimistic Update)
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

    // Şimdi arka planda Supabase veritabanını güncelleyelim
    if (updatedStatus) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: updatedStatus })
        .eq("id", parseInt(activeId)); // string id'yi veritabanındaki bigint için sayıya çevirdik

      if (error) {
        console.error("Veritabanı güncellenirken hata oluştu, veriler geri çekiliyor...");
        fetchTasks(); // Hata varsa veritabanındaki orijinal hali geri yükle
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <main className="p-10 bg-[#f8fafc] min-h-screen font-sans">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Nebula</h1>
            <p className="text-slate-500 mt-1 font-medium">Proje ve Takım Yönetim Paneli</p>
          </div>

          <form onSubmit={handleAddTask} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <input
              type="text"
              placeholder="Yeni görev adı..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 w-64 text-slate-800"
            />
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700"
            >
              <option value="Yazılım">Yazılım</option>
              <option value="Donanım">Donanım</option>
              <option value="Rapor">Rapor</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Ekle
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-slate-500 font-medium animate-pulse">Nebula yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COLUMNS.map((colTitle) => (
              <Column 
                key={colTitle} 
                title={colTitle} 
                tasks={tasks.filter((t) => t.status === colTitle)} 
              />
            ))}
          </div>
        )}
      </main>
    </DndContext>
  );
}