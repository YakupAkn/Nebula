import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
}

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)",
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? "1.03" : "1",
  };

  const tagColors: Record<string, string> = {
    "Rapor": "bg-amber-50 text-amber-700 border border-amber-200",
    "Donanım": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Yazılım": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-400/50 transition-all cursor-grab active:cursor-grabbing group relative select-none"
    >
      <div className="flex justify-between items-center mb-3 select-none">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${tagColors[task.tag] || "bg-slate-100 text-slate-700"}`}>
          {task.tag}
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if(confirm("Bu görevi silmek istediğine emin misin?")) onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 transition-all duration-200"
          title="Görevi Sil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
      
      {/* Sürükleme tetikleyicileri bu alana basınca çalışır, metin seçilemez */}
      <div {...attributes} {...listeners} className="w-full h-full select-none">
        <h3 className="font-medium text-slate-800 text-[14px] leading-snug tracking-tight pointer-events-none">
          {task.title}
        </h3>
      </div>
    </div>
  );
}