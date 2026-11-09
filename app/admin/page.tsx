"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NAME_TOKEN, renderEmail } from "@/lib/email-template";
import MfaGate from "./mfa-gate";

type Audience = "all" | "beta" | "selected";
type PageState = "loading" | "forbidden" | "mfa" | "error" | "ready";

interface RecipientRow {
  id: string;
  email: string;
  fullName: string | null;
  betaTester: boolean;
}

interface HistoryRow {
  id: string;
  subject: string;
  audience: "all" | "beta" | "selected" | "test";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface SendResult {
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skipped: number;
  failures: { email: string; error: string }[];
  test: boolean;
}

const AUDIENCE_LABEL: Record<HistoryRow["audience"], string> = {
  all: "Herkes",
  beta: "Beta",
  selected: "Seçilenler",
  test: "Test",
};

async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
  });
}

const input =
  "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

export default function AdminPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState("");
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const [audience, setAudience] = useState<Audience>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const [sending, setSending] = useState<null | "test" | "send">(null);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);

  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);

  const loadHistory = useCallback(async () => {
    const res = await authFetch("/api/admin/announcements");
    if (res.ok) {
      const data = (await res.json()) as { announcements: HistoryRow[]; quota?: { used: number; limit: number } };
      setHistory(data.announcements);
      setQuota(data.quota ?? null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const res = await authFetch("/api/admin/recipients");
      if (cancelled) return;
      if (res.status === 403) {
        const body = (await res.clone().json().catch(() => ({}))) as { code?: string };
        if (body.code === "mfa_required") {
          setPageState("mfa");
          return;
        }
      }
      if (res.status === 401 || res.status === 403) {
        setPageState("forbidden");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setPageError(data.error ?? "Kullanıcılar yüklenemedi.");
        setPageState("error");
        return;
      }
      const data = (await res.json()) as { recipients: RecipientRow[] };
      setRecipients(data.recipients);
      setPageState("ready");
      loadHistory();
    };
    load().catch(() => {
      if (!cancelled) {
        setPageError("Bağlantı hatası.");
        setPageState("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router, loadHistory]);

  const betaCount = useMemo(() => recipients.filter((r) => r.betaTester).length, [recipients]);
  const targetCount = audience === "all" ? recipients.length : audience === "beta" ? betaCount : selected.size;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.email.toLowerCase().includes(q) || (r.fullName ?? "").toLowerCase().includes(q));
  }, [recipients, search]);

  const preview = useMemo(
    () => renderEmail({ subject, body: body || "Mesajın burada görünecek.", name: "Ayşe Yılmaz", unsubscribeUrl: "#" }),
    [subject, body]
  );

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleBeta = async (row: RecipientRow) => {
    const next = !row.betaTester;
    setRecipients((prev) => prev.map((r) => (r.id === row.id ? { ...r, betaTester: next } : r)));
    const res = await authFetch("/api/admin/recipients", {
      method: "PATCH",
      body: JSON.stringify({ id: row.id, betaTester: next }),
    });
    if (!res.ok) {
      setRecipients((prev) => prev.map((r) => (r.id === row.id ? { ...r, betaTester: row.betaTester } : r)));
      setFormError("Beta grubu güncellenemedi.");
    }
  };

  const send = async (mode: "test" | "send") => {
    setFormError("");
    setResult(null);
    if (!subject.trim() || !body.trim()) {
      setFormError("Konu ve mesaj boş olamaz.");
      return;
    }
    if (mode === "send") {
      if (targetCount === 0) {
        setFormError("Seçili grupta alıcı yok.");
        return;
      }
      const ok = window.confirm(`"${subject.trim()}" konulu duyuru ${targetCount} kişiye gönderilecek. Emin misin?`);
      if (!ok) return;
    }

    setSending(mode);
    try {
      const res = await authFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({
          subject,
          body,
          audience: mode === "test" ? "test" : audience,
          userIds: audience === "selected" ? Array.from(selected) : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<SendResult> & { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Gönderilemedi.");
        return;
      }
      setResult({
        recipientCount: data.recipientCount ?? 0,
        sentCount: data.sentCount ?? 0,
        failedCount: data.failedCount ?? 0,
        skipped: data.skipped ?? 0,
        failures: data.failures ?? [],
        test: mode === "test",
      });
      loadHistory();
    } catch {
      setFormError("Bağlantı hatası, gönderim durumunu geçmişten kontrol et.");
    } finally {
      setSending(null);
    }
  };

  if (pageState === "loading") {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center text-sm text-slate-500">
        Yükleniyor...
      </main>
    );
  }

  if (pageState === "mfa") return <MfaGate />;

  if (pageState === "forbidden" || pageState === "error") {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-bold text-slate-900 mb-2">
            {pageState === "forbidden" ? "Erişim yok" : "Bir sorun oluştu"}
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            {pageState === "forbidden" ? "Bu sayfa yalnızca yöneticilere açık." : pageError}
          </p>
          <Link href="/" className="text-sm text-indigo-600 font-medium">
            Nebula&apos;ya dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            Nebula <span className="text-slate-400 font-semibold">/ Duyurular</span>
          </h1>
          <Link href="/" className="text-xs text-slate-500 hover:text-indigo-600 font-semibold">
            Panoya dön
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Yazım */}
        <section className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Konu</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Nebula'da yeni: ..." className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mesaj</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder={`Merhaba ${NAME_TOKEN},\n\nBu hafta yeni ne var...`}
                className={`${input} resize-y`}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Düz metin. Boş satır yeni paragraf açar, https:// adresleri bağlantı olur, {NAME_TOKEN} alıcının adıyla
                değişir. Abonelikten çık bağlantısı otomatik eklenir.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Önizleme</h2>
              <button onClick={() => setShowPreview((v) => !v)} className="text-xs text-indigo-600 font-medium">
                {showPreview ? "Gizle" : "Göster"}
              </button>
            </div>
            {showPreview && (
              <iframe title="E-posta önizleme" sandbox="" srcDoc={preview.html} className="w-full h-[420px] rounded-xl border border-slate-200 bg-white" />
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Gönder</h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(
                [
                  ["all", "Herkes", recipients.length],
                  ["beta", "Beta testçiler", betaCount],
                  ["selected", "Seçilenler", selected.size],
                ] as [Audience, string, number][]
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAudience(id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === id ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-800">{label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{count} kişi</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Yalnızca e-posta almayı kabul etmiş kullanıcılar listelenir ve onlara gönderilir.
            </p>

            {formError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl font-medium mb-4">{formError}</div>
            )}

            {result && (
              <div
                className={`text-xs px-3.5 py-3 rounded-xl border mb-4 ${
                  result.failedCount === 0 ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-amber-800 bg-amber-50 border-amber-100"
                }`}
              >
                <div className="font-semibold">
                  {result.test ? "Test e-postası" : "Duyuru"}: {result.sentCount}/{result.recipientCount} gönderildi
                  {result.failedCount > 0 && `, ${result.failedCount} başarısız`}
                  {result.skipped > 0 && `, ${result.skipped} kişi atlandı (onayı yok)`}
                </div>
                {result.failures.length > 0 && (
                  <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.failures.map((f) => (
                      <li key={f.email}>
                        {f.email}: {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => send("test")}
                disabled={sending !== null}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
              >
                {sending === "test" ? "Gönderiliyor..." : "Test gönder (bana)"}
              </button>
              <button
                onClick={() => send("send")}
                disabled={sending !== null || targetCount === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
              >
                {sending === "send" ? "Gönderiliyor, sayfayı kapatma..." : `${targetCount} kişiye gönder`}
              </button>
            </div>
          </div>
        </section>

        {/* Kullanıcılar + geçmiş */}
        <section className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Kullanıcılar ({recipients.length})</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad veya e-posta ara" className={`${input} mb-3`} />
            {audience === "selected" && (
              <div className="flex gap-3 text-[11px] font-medium mb-2">
                <button onClick={() => setSelected(new Set(filtered.map((r) => r.id)))} className="text-indigo-600">
                  Görünenleri seç
                </button>
                <button onClick={() => setSelected(new Set())} className="text-slate-500">
                  Temizle
                </button>
              </div>
            )}
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 && <li className="py-6 text-center text-xs text-slate-400">Kullanıcı bulunamadı.</li>}
              {filtered.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  {audience === "selected" && (
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelected(r.id)} className="h-4 w-4 accent-indigo-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-800 truncate">{r.fullName || "—"}</div>
                    <div className="text-[11px] text-slate-500 truncate">{r.email}</div>
                  </div>
                  <button
                    onClick={() => toggleBeta(r)}
                    title="Beta test grubuna ekle / çıkar"
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
                      r.betaTester ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
                    }`}
                  >
                    BETA
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Geçmiş
              {quota && (
                <span className="ml-2 text-[11px] font-medium text-slate-400">
                  Son 24 saat: {quota.used}/{quota.limit} e-posta
                </span>
              )}
            </h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">Henüz duyuru gönderilmedi.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((h) => (
                  <li key={h.id} className="py-2.5">
                    <div className="text-xs font-medium text-slate-800 truncate">{h.subject}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {AUDIENCE_LABEL[h.audience]} · {h.sent_count}/{h.recipient_count}
                      {h.failed_count > 0 && ` · ${h.failed_count} hata`} · {new Date(h.created_at).toLocaleString("tr-TR")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
