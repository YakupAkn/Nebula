"use client";

import { useMemo } from "react";

export interface ActivityEvent {
  id: string;
  actor_name: string;
  event_type: "task_created" | "task_completed" | "task_moved" | "task_updated" | "task_deleted";
  task_title: string;
  created_at: string;
}

const EVENT_LABEL: Record<ActivityEvent["event_type"], string> = {
  task_created: "yeni görev oluşturdu",
  task_completed: "görevi tamamladı",
  task_moved: "görevi taşıdı",
  task_updated: "görevi güncelledi",
  task_deleted: "görevi sildi",
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ContributionGraph({ events }: { events: ActivityEvent[] }) {
  const { days, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    const counts = new Map<string, number>();

    events.forEach((event) => {
      const date = new Date(event.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const values = Array.from({ length: 365 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      return { date, count: counts.get(key) ?? 0 };
    });

    return { days: values, total: events.length };
  }, [events]);

  const level = (count: number) => {
    if (count === 0) return "bg-slate-100";
    if (count === 1) return "bg-emerald-200";
    if (count <= 3) return "bg-emerald-400";
    return "bg-emerald-600";
  };

  return (
    <section aria-labelledby="contribution-graph-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="contribution-graph-title" className="text-lg font-semibold text-slate-900">Son 12 ayda {total} katkı</h2>
          <p className="mt-1 text-sm text-slate-500">Görev oluşturma, tamamlama, taşıma ve güncelleme hareketleriniz.</p>
        </div>
        <span className="text-xs text-slate-500">Son 365 gün</span>
      </div>

      <div className="mt-5 overflow-x-auto pb-1" aria-label="Günlük kişisel katkı grafiği">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${total} toplam katkı`}>
          {days.map(({ date, count }) => (
            <span
              key={date.toISOString()}
              title={`${date.toLocaleDateString("tr-TR")}: ${count} katkı`}
              className={`h-3 w-3 rounded-sm ${level(count)}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
        <span>Az</span>
        {[0, 1, 2, 4].map((count) => <span key={count} aria-hidden="true" className={`h-3 w-3 rounded-sm ${level(count)}`} />)}
        <span>Çok</span>
      </div>
    </section>
  );
}

export function ActivityFeed({ events, personal = false }: { events: ActivityEvent[]; personal?: boolean }) {
  return (
    <section aria-labelledby="activity-feed-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="activity-feed-title" className="text-lg font-semibold text-slate-900">
            {personal ? "Kişisel katkı etkinliği" : "Katkı etkinliği"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {personal ? "Son yaptığınız görev hareketleri." : "Bu projedeki ekip hareketleri."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Son {events.length}</span>
      </div>

      {events.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Henüz gösterilecek bir katkı yok.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-slate-100">
          {events.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <p className="min-w-0 text-sm text-slate-700">
                {!personal && <span className="font-semibold text-slate-900">{event.actor_name} </span>}
                <span>{EVENT_LABEL[event.event_type]}: </span>
                <span className="font-medium text-slate-900">{event.task_title}</span>
              </p>
              <time dateTime={event.created_at} className="shrink-0 text-xs text-slate-500">{formatWhen(event.created_at)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
