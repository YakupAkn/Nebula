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
    <div className="flex flex-col bg-slate-100/60 rounded-2xl p-4 min-h-[500px] border border-slate-200/60 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            title === "Yapılacaklar" ? "bg-indigo-500" : title === "Devam Edenler" ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          <h2 className="font-semibold text-slate-700 text-sm tracking-tight">{title}</h2>
        </div>
        <span className="bg-slate-200/80 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 flex-1">
            {tasks.length === 0 ? (
              <div className="flex-1 min-h-[150px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-center select-none pointer-events-none transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-slate-300 mb-1"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-slate-400 font-medium text-xs">Henüz görev yok</p>
                <p className="text-[10px] text-slate-400/80 mt-0.5">Kartları buraya sürükleyebilirsiniz</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onTaskClick={onTaskClick} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}