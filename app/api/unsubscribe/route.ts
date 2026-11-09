import { NextResponse } from "next/server";
import { errorResponse, getServiceClient } from "@/lib/server/supabase-admin";
import { verifyUserToken } from "@/lib/server/unsubscribe";

export const runtime = "nodejs";

/**
 * Duyuru aboneliğini iptal eder. Kullanıcı id'si (u) ve imzası (t) ya adres sorgusunda
 * (e-posta istemcilerinin tek tıkla iptali) ya da JSON gövdesinde (iptal sayfası) gelir.
 * Yalnızca POST: bağlantı önizleyen tarayıcılar / güvenlik tarayıcıları yanlışlıkla iptal etmesin.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let u = url.searchParams.get("u") ?? "";
    let t = url.searchParams.get("t") ?? "";

    if (!u || !t) {
      const body = (await request.json().catch(() => null)) as { u?: unknown; t?: unknown } | null;
      if (typeof body?.u === "string") u = body.u;
      if (typeof body?.t === "string") t = body.t;
    }

    if (!verifyUserToken(u, t)) {
      return NextResponse.json({ error: "Bağlantı geçersiz." }, { status: 400 });
    }

    const { error } = await getServiceClient()
      .from("profiles")
      .update({ marketing_consent: false, marketing_consent_at: null })
      .eq("id", u);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
