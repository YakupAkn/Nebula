import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
  description: string | null;
  due_date: string | null;
  assignee: string | null;
  priority?: string;
}

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function isOverdue(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  return date < today;
}

export function TaskCard({ task, onDelete, onTaskClick }: TaskCardProps) {
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

  const overdue = task.due_date ? isOverdue(task.due_date) : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
      className="bg-white p-4 pl-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-400/50 transition-all cursor-grab active:cursor-grabbing group relative select-none overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        task.priority === "High" ? "bg-rose-500" :
        task.priority === "Low" ? "bg-emerald-400" : "bg-amber-400"
      }`} />
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1.5 items-center">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${tagColors[task.tag] || "bg-slate-100 text-slate-700"}`}>
            {task.tag}
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            task.priority === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" :
            task.priority === "Low" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
            "bg-amber-50 text-amber-600 border border-amber-100"
          }`}>
            {task.priority || "Medium"}
          </span>
        </div>

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

      <div className="w-full h-full pointer-events-none">
        <h3 className="font-medium text-slate-800 text-[14px] leading-snug tracking-tight">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {(task.assignee || task.due_date) && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            {task.assignee ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                  {task.assignee.charAt(0)}
                </span>
                {task.assignee}
              </span>
            ) : <span />}

            {task.due_date && (
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                overdue ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
              }`}>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}