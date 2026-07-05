import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
}

export function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1, // Sürüklenirken kart şeffaflaşır
  };

  // Etikete göre renk belirleme
  const tagColors: Record<string, string> = {
    "Rapor": "bg-amber-100 text-amber-700",
    "Donanım": "bg-emerald-100 text-emerald-700",
    "Yazılım": "bg-indigo-100 text-indigo-700",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${tagColors[task.tag] || "bg-slate-100 text-slate-700"}`}>
          {task.tag}
        </span>
      </div>
      <h3 className="font-semibold text-slate-800 text-sm leading-snug">{task.title}</h3>
    </div>
  );
}