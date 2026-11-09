import nodemailer, { type Transporter } from "nodemailer";
import { ConfigError } from "./supabase-admin";

/**
 * SMTP ayarları (sunucu ortam değişkenleri):
 *   SMTP_HOST      örn. smtp.gmail.com
 *   SMTP_PORT      465 (SSL) ya da 587 (STARTTLS). Varsayılan 465
 *   SMTP_USER      SMTP kullanıcı adı (Supabase Magic Link'te kullandığınla aynı)
 *   SMTP_PASS      SMTP şifresi / uygulama şifresi
 *   SMTP_FROM      "Nebula <ornek@alanadi.com>" (boşsa SMTP_USER kullanılır)
 *   SMTP_REPLY_TO  (isteğe bağlı) yanıtların gideceği adres
 */

export interface MailerConfig {
  transporter: Transporter;
  from: string;
  replyTo?: string;
}

export function createMailer(): MailerConfig {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const missing = [!host && "SMTP_HOST", !user && "SMTP_USER", !pass && "SMTP_PASS"].filter(Boolean);
  if (missing.length > 0) {
    throw new ConfigError(`SMTP yapılandırması eksik: ${missing.join(", ")} tanımlı değil.`);
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  return {
    transporter,
    from: process.env.SMTP_FROM || user!,
    replyTo: process.env.SMTP_REPLY_TO || undefined,
  };
}
