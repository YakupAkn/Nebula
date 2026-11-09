import { NextResponse } from "next/server";
import { errorResponse, requireAdmin } from "@/lib/server/supabase-admin";
import { listConsentedRecipients } from "@/lib/server/recipients";
import { isUuid } from "@/lib/server/unsubscribe";

export const runtime = "nodejs";

/** E-posta almayı kabul etmiş kullanıcılar (yalnızca adminler). */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const recipients = await listConsentedRecipients(auth.ctx.db);
    return NextResponse.json({
      recipients: recipients
        .map((r) => ({ id: r.id, email: r.email, fullName: r.fullName, betaTester: r.betaTester }))
        .sort((a, b) => a.email.localeCompare(b.email)),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Bir kullanıcıyı beta test grubuna ekler / gruptan çıkarır. Gövde: { id, betaTester } */
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => null)) as { id?: unknown; betaTester?: unknown } | null;
    if (!body || typeof body.id !== "string" || !isUuid(body.id) || typeof body.betaTester !== "boolean") {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { error } = await auth.ctx.db.from("profiles").update({ beta_tester: body.betaTester }).eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
