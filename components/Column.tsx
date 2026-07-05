import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  title: string;
  tasks: any[];
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: any) => void;
}

export function Column({ title, tasks, onDeleteTask, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <div className="flex flex-col bg-slate-100/60 p-4 rounded-2xl border border-slate-200/60 w-full min-h-[650px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            title === "Yapılacaklar" ? "bg-indigo-500" : title === "Devam Edenler" ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          <h2 className="font-semibold text-slate-700 text-sm tracking-tight">{title}</h2>
        </div>
        <span className="bg-slate-200/80 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onTaskClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}