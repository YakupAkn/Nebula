import { NextResponse } from "next/server";
import { errorResponse, requireAdmin } from "@/lib/server/supabase-admin";
import { listConsentedRecipients, type Recipient } from "@/lib/server/recipients";
import { createMailer } from "@/lib/server/mailer";
import { isUuid, siteOrigin, unsubscribeLinks } from "@/lib/server/unsubscribe";
import { renderEmail, safeSubject } from "@/lib/email-template";

export const runtime = "nodejs";
// Çok alıcıda gönderim uzun sürebilir; barındırma platformu izin verdiği kadar bekler
export const maxDuration = 300;

const AUDIENCES = ["all", "beta", "selected", "test"] as const;
type Audience = (typeof AUDIENCES)[number];

const MAX_SUBJECT = 200;
const MAX_BODY = 20000;
const MAX_SELECTED = 500;
const MAX_STORED_FAILURES = 50;
const CONCURRENCY = 5;
/** Son 24 saatte gönderilebilecek en fazla e-posta. Gmail ~500; magic link için pay bırakır. */
const DAILY_LIMIT = Math.max(1, Number(process.env.NEWSLETTER_DAILY_LIMIT) || 400);
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

const NO_STORE = { "Cache-Control": "no-store" };

async function usedToday(db: import("@supabase/supabase-js").SupabaseClient): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db.from("announcements").select("recipient_count").gte("created_at", since);
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + (r.recipient_count ?? 0), 0);
}

/** Geçmiş duyurular (yalnızca adminler). */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.ctx.db
      .from("announcements")
      .select("id, subject, audience, recipient_count, sent_count, failed_count, failures, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const used = await usedToday(auth.ctx.db);
    return NextResponse.json(
      { announcements: data ?? [], quota: { used, limit: DAILY_LIMIT } },
      { headers: NO_STORE }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

interface SendBody {
  subject?: unknown;
  body?: unknown;
  audience?: unknown;
  userIds?: unknown;
}

/**
 * Duyuru gönderir. Gövde: { subject, body, audience: "all" | "beta" | "selected" | "test", userIds? }
 *   all      e-posta almayı kabul eden herkes
 *   beta     kabul edenlerden beta_tester olanlar
 *   selected userIds içinden, kabul edenler
 *   test     yalnızca isteği yapan adminin kendi adresi (kayıtta "test" olarak görünür)
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const { db, user, fullName } = auth.ctx;

    const input = (await request.json().catch(() => null)) as SendBody | null;
    const subject = typeof input?.subject === "string" ? safeSubject(input.subject) : "";
    const body = typeof input?.body === "string" ? input.body.trim() : "";
    const audience = input?.audience as Audience;

    if (!subject || subject.length > MAX_SUBJECT) {
      return NextResponse.json({ error: `Konu 1-${MAX_SUBJECT} karakter olmalı.` }, { status: 400 });
    }
    if (!body || body.length > MAX_BODY) {
      return NextResponse.json({ error: `Mesaj 1-${MAX_BODY} karakter olmalı.` }, { status: 400 });
    }
    if (!AUDIENCES.includes(audience)) {
      return NextResponse.json({ error: "Geçersiz alıcı grubu." }, { status: 400 });
    }

    // Yapılandırma eksikse alıcı çözümlemeden önce anlaşılır hata ver
    const mailer = createMailer();
    const origin = siteOrigin(request);

    let recipients: Recipient[];
    let skipped = 0;

    if (audience === "test") {
      recipients = [{ id: user.id, email: user.email, fullName, betaTester: false }];
    } else {
      const consented = await listConsentedRecipients(db);
      if (audience === "all") {
        recipients = consented;
      } else if (audience === "beta") {
        recipients = consented.filter((r) => r.betaTester);
      } else {
        const ids = Array.isArray(input?.userIds) ? input.userIds : [];
        const wanted = new Set(ids.filter((x): x is string => typeof x === "string" && isUuid(x)));
        if (wanted.size === 0 || wanted.size > MAX_SELECTED) {
          return NextResponse.json({ error: `1-${MAX_SELECTED} kullanıcı seçmelisin.` }, { status: 400 });
        }
        recipients = consented.filter((r) => wanted.has(r.id));
        skipped = wanted.size - recipients.length; // onayı olmayan / bulunamayanlar
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Gönderilecek alıcı bulunamadı." }, { status: 400 });
    }

    // Günlük limit: SMTP hesabı (ve Magic Link e-postaları) tükenmesin
    const used = await usedToday(db);
    if (used + recipients.length > DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Günlük gönderim limiti aşılır (son 24 saatte ${used}/${DAILY_LIMIT}). Alıcı sayısı: ${recipients.length}.` },
        { status: 429 }
      );
    }

    // Aynı duyurunun art arda / çift tıkla gönderilmesini engelle
    if (audience !== "test") {
      const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
      const { data: dup, error: dupError } = await db
        .from("announcements")
        .select("id")
        .eq("subject", subject)
        .eq("audience", audience)
        .gte("created_at", since)
        .limit(1);
      if (dupError) throw dupError;
      if (dup && dup.length > 0) {
        return NextResponse.json({ error: "Bu duyuru az önce gönderildi. Birkaç dakika bekle." }, { status: 409 });
      }
    }

    // Gönderimden ÖNCE kayıt aç: eşzamanlı ikinci istek kota ve çift gönderim kontrolünde bunu görür
    const { data: claim, error: claimError } = await db
      .from("announcements")
      .insert({ subject, body, audience, sent_by: user.id, recipient_count: recipients.length })
      .select("id")
      .single();
    if (claimError) throw claimError;

    const failures: { email: string; error: string }[] = [];
    let sent = 0;
    let cursor = 0;

    const worker = async () => {
      while (cursor < recipients.length) {
        const r = recipients[cursor++];
        try {
          const links = unsubscribeLinks(origin, r.id);
          const { html, text } = renderEmail({ subject, body, name: r.fullName, unsubscribeUrl: links.page });
          await mailer.transporter.sendMail({
            from: mailer.from,
            to: r.email,
            replyTo: mailer.replyTo,
            subject,
            html,
            text,
            headers: {
              "List-Unsubscribe": `<${links.api}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });
          sent++;
        } catch (err) {
          failures.push({ email: r.email, error: err instanceof Error ? err.message.slice(0, 200) : "Bilinmeyen hata" });
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, recipients.length) }, worker));
    } finally {
      mailer.transporter.close();
    }

    const { error: saveError } = await db
      .from("announcements")
      .update({
        sent_count: sent,
        failed_count: failures.length,
        failures: failures.slice(0, MAX_STORED_FAILURES),
      })
      .eq("id", claim.id);
    if (saveError) console.error("Duyuru kaydı güncellenemedi:", saveError.message);

    return NextResponse.json({
      id: claim.id,
      recipientCount: recipients.length,
      sentCount: sent,
      failedCount: failures.length,
      skipped,
      failures: failures.slice(0, MAX_STORED_FAILURES),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
