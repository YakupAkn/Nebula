
interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
  description: string | null;
  due_date: string | null;
  assignee: string | null;
}

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, description: string) => void;
  onUpdateMeta: (
    id: string,
    updates: { due_date?: string | null; assignee?: string | null }
  ) => void;
  orgMembers: string[];
}

export function TaskModal({ task, onClose, onUpdate, onUpdateMeta, orgMembers }: TaskModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {task.tag}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Atanan Kişi</label>
            <select
              value={task.assignee || ""}
              onChange={(e) => onUpdateMeta(task.id, { assignee: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-800 bg-slate-50/50"
            >
              {orgMembers.length === 0 ? (
                <option value={task.assignee || ""}>{task.assignee || "Atanmadı"}</option>
              ) : (
                <>
                  {task.assignee && !orgMembers.includes(task.assignee) && (
                    <option value={task.assignee}>{task.assignee}</option>
                  )}
                  {orgMembers.map((member) => (
                    <option key={member} value={member}>
                      {member.split("@")[0]}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Son Teslim Tarihi</label>
            <input
              type="date"
              value={task.due_date || ""}
              onChange={(e) => onUpdateMeta(task.id, { due_date: e.target.value || null })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-800 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Görev Açıklaması</label>
          <textarea
            defaultValue={task.description || ""}
            placeholder="Bu görev için detaylı bir açıklama yazın..."
            className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-800 bg-slate-50/50 resize-none"
            onBlur={(e) => onUpdate(task.id, e.target.value)}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 text-sm transition-all shadow-sm"
        >
          Kapat ve Kaydet
        </button>
      </div>
    </div>
  );
}