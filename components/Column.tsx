import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  title: string;
  tasks: any[];
}

export function Column({ title, tasks }: ColumnProps) {
  // Sütunun kendisini bırakılabilir bir alan yapıyoruz
  const { setNodeRef } = useDroppable({
    id: title, 
  });

  return (
    <div className="flex flex-col bg-slate-100/50 p-4 rounded-3xl border border-slate-200 w-full min-h-[600px]">
      <div className="flex items-center justify-between mb-5 px-2">
        <h2 className="font-bold text-slate-700 text-sm tracking-wide">{title}</h2>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Görevlerin Listelendiği Alan */}
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}