"use client";
import { useState } from "react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "@/components/Column";

const COLUMNS = ["Yapılacaklar", "Devam Edenler", "Tamamlananlar"];

export default function Home() {
  const [tasks, setTasks] = useState([
    { id: "1", title: "Ön Değerlendirme Raporu Taslağı", status: "Yapılacaklar", tag: "Rapor" },
    { id: "2", title: "Motor Sürücü Devresi PCB Çizimi", status: "Yapılacaklar", tag: "Donanım" },
    { id: "3", title: "Görüntü İşleme Algoritması Optimizasyonu", status: "Devam Edenler", tag: "Yazılım" },
  ]);

  // Yeni görev ekleme state'leri
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Yazılım");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Yeni Görev Ekleme Fonksiyonu
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(), // Benzersiz geçici ID
      title: newTitle,
      status: "Yapılacaklar", // Yeni işler her zaman buradan başlar
      tag: newTag,
    };

    setTasks([...tasks, newTask]);
    setNewTitle(""); // Inputu temizle
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setTasks((prevTasks) => {
      const activeIndex = prevTasks.findIndex((t) => t.id === activeId);

      if (COLUMNS.includes(overId)) {
        const newTasks = [...prevTasks];
        newTasks[activeIndex].status = overId;
        return newTasks;
      }

      const overIndex = prevTasks.findIndex((t) => t.id === overId);
      if (overIndex !== -1) {
        const newTasks = [...prevTasks];
        newTasks[activeIndex].status = newTasks[overIndex].status;
        return arrayMove(newTasks, activeIndex, overIndex);
      }

      return prevTasks;
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <main className="p-10 bg-[#f8fafc] min-h-screen font-sans">
        
        {/* Üst Alan: Başlık ve Hızlı Görev Ekleme Formu */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Nebula</h1>
            <p className="text-slate-500 mt-1 font-medium">Proje ve Takım Yönetim Paneli</p>
          </div>

          {/* Hızlı Ekleme Formu */}
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
        {/* Kanban Sütunları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COLUMNS.map((colTitle) => (
            <Column 
              key={colTitle} 
              title={colTitle} 
              tasks={tasks.filter((t) => t.status === colTitle)} 
            />
          ))}
        </div>
      </main>
    </DndContext>
  );
}