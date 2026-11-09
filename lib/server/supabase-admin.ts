import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Yalnızca sunucuda kullanılır. SUPABASE_SERVICE_ROLE_KEY asla NEXT_PUBLIC_ ile başlamamalı
 * ve istemci koduna import edilmemelidir (RLS'i aşar).
 */

export class ConfigError extends Error {}

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ConfigError("Sunucu yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  }
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

export interface AdminContext {
  db: SupabaseClient;
  user: { id: string; email: string };
  fullName: string | null;
}

type AdminResult = { ok: true; ctx: AdminContext } | { ok: false; response: NextResponse };

function jwtAal(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { aal?: unknown };
    return typeof payload.aal === "string" ? payload.aal : null;
  } catch {
    return null;
  }
}

/**
 * İsteğin Authorization: Bearer <access_token> başlığını doğrular ve kullanıcının
 * profiles.is_admin = true olduğunu kontrol eder. Yetkisiz isteklere 401/403 döner.
 */
export async function requireAdmin(request: Request): Promise<AdminResult> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Giriş gerekli." }, { status: 401 }) };
  }

  const db = getServiceClient();
  const { data: userData, error: userError } = await db.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user || !user.email) {
    return { ok: false, response: NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 }) };
  }

  // İkinci adım: yalnızca MFA (TOTP) ile doğrulanmış oturumlar (aal2). Jeton getUser ile zaten doğrulandı.
  if (jwtAal(token) !== "aal2") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "İkinci adım doğrulaması gerekli.", code: "mfa_required" },
        { status: 403 }
      ),
    };
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return { ok: false, response: NextResponse.json({ error: "Bu sayfaya erişim yetkin yok." }, { status: 403 }) };
  }

  return {
    ok: true,
    ctx: { db, user: { id: user.id, email: user.email }, fullName: profile.full_name ?? null },
  };
}

/** ConfigError'ı okunur bir yanıta çevirir, diğer hataları loglayıp genel mesaj döner. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ConfigError) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  console.error(err);
  return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
}
