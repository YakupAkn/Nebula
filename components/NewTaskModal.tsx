"use client";
import { useEffect, useRef } from "react";

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  tag: string;
  onTagChange: (v: string) => void;
  assignee: string;
  onAssigneeChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  orgMembers: string[];
  currentUserEmail: string | null;
}

export function NewTaskModal({
  open,
  onClose,
  onSubmit,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  tag,
  onTagChange,
  assignee,
  onAssigneeChange,
  priority,
  onPriorityChange,
  dueDate,
  onDueDateChange,
  orgMembers,
  currentUserEmail,
}: NewTaskModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ESC ile kapatma
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    // Modal açıkken arka planın kaymasını engelle
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      // Açılış animasyonu bittikten hemen sonra odaklan
      const t = setTimeout(() => titleInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Yeni Görev</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
            aria-label="Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Görev adı
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              placeholder="Görevin adını yazın..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Açıklama
            </label>
            <textarea
              placeholder="Görev hakkında kısa açıklama..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 placeholder-slate-400 resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tür
              </label>
              <select
                value={tag}
                onChange={(e) => onTagChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 font-medium"
              >
                <option value="Yazılım">Yazılım</option>
                <option value="Donanım">Donanım</option>
                <option value="Rapor">Rapor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Atanan kişi
              </label>
              <select
                value={assignee || currentUserEmail || ""}
                onChange={(e) => onAssigneeChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 font-medium"
              >
                {orgMembers.length === 0 ? (
                  <option value={currentUserEmail ?? ""}>{currentUserEmail ?? "Ben"}</option>
                ) : (
                  orgMembers.map((email) => (
                    <option key={email} value={email}>
                      {email.split("@")[0]}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Öncelik
              </label>
              <select
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 font-medium"
              >
                <option value="Low">Düşük (Low)</option>
                <option value="Medium">Orta (Medium)</option>
                <option value="High">Yüksek (High)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Son tarih
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all"
            >
              Görevi Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
