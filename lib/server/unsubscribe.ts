import { createHmac, timingSafeEqual } from "node:crypto";
import { ConfigError } from "./supabase-admin";

/**
 * Abonelik iptal bağlantıları veritabanında jeton saklamadan, kullanıcı id'sinin
 * HMAC imzasıyla doğrulanır. Gizli anahtar: NEWSLETTER_SECRET (en az 16 karakter, rastgele).
 * Anahtarı değiştirirsen daha önce gönderilmiş tüm iptal bağlantıları geçersiz olur.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string {
  const s = process.env.NEWSLETTER_SECRET;
  if (!s || s.length < 16) {
    throw new ConfigError("NEWSLETTER_SECRET tanımlı değil (en az 16 karakter, rastgele bir değer olmalı).");
  }
  return s;
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function signUserId(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("hex");
}

export function verifyUserToken(userId: string, token: string): boolean {
  if (!isUuid(userId) || !/^[0-9a-f]{64}$/i.test(token)) return false;
  const expected = Buffer.from(signUserId(userId), "hex");
  const given = Buffer.from(token, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Sitenin kök adresi. Proxy arkasında istek adresi güvenilmez olduğundan SITE_URL tercih edilir. */
export function siteOrigin(request: Request): string {
  const configured = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || new URL(request.url).origin).replace(/\/+$/, "");
}

export function unsubscribeLinks(origin: string, userId: string) {
  const base = origin.replace(/\/+$/, "");
  const query = `u=${userId}&t=${signUserId(userId)}`;
  return {
    /** E-postadaki görünür bağlantı: onay sayfası */
    page: `${base}/abonelik-iptal?${query}`,
    /** List-Unsubscribe başlığı için tek tıkla iptal (POST) */
    api: `${base}/api/unsubscribe?${query}`,
  };
}
