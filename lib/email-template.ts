/**
 * Duyuru e-postası şablonu. Saf fonksiyonlar: hem sunucuda (gönderim) hem de
 * admin arayüzünde (canlı önizleme) aynı çıktıyı üretir.
 *
 * Mesaj düz metindir. Boş satır = yeni paragraf, http(s) adresleri bağlantıya çevrilir,
 * {{ad}} alıcının adıyla değişir. HTML girişi her zaman kaçırılır (escape).
 */

export const NAME_TOKEN = "{{ad}}";

/** Supabase Storage'daki herkese açık "assets" kovası. E-postada mutlak adres gerekir. */
export const DEFAULT_LOGO_URL =
  "https://wuggznusaygfmwnsuurk.supabase.co/storage/v1/object/public/assets/logo-light.png";
const FALLBACK_NAME = "Nebula kullanıcısı";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "Ayşe Yılmaz" -> "Ayşe". Ad yoksa genel bir hitap döner. */
export function firstName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || FALLBACK_NAME;
}

function applyName(text: string, name: string): string {
  return text.split(NAME_TOKEN).join(name);
}

/** Konu satırına satır sonu sokulmasını (header injection) engeller. */
export function safeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}

function linkify(escaped: string): string {
  // `escaped` zaten HTML-kaçışlı; & -> &amp; olduğu için href içinde de geçerlidir
  return escaped.replace(
    /https?:\/\/[^\s<]+/g,
    (url) => {
      // Cümle sonundaki noktalama bağlantıya dahil olmasın
      const m = url.match(/^(.*?)([.,;:!?)]*)$/);
      const clean = m ? m[1] : url;
      const tail = m ? m[2] : "";
      return `<a href="${clean}" style="color:#4f46e5;text-decoration:underline;">${clean}</a>${tail}`;
    }
  );
}

export interface RenderInput {
  subject: string;
  body: string;
  /** Alıcının tam adı; {{ad}} için ilk kelimesi kullanılır */
  name?: string | null;
  /** Abonelik iptal sayfası. Verilmezse alt bilgide bağlantı yerine açıklama yazılır. */
  unsubscribeUrl?: string | null;
  /** Başlıktaki logo. Verilmezse DEFAULT_LOGO_URL kullanılır. */
  logoUrl?: string | null;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function renderEmail({ subject, body, name, unsubscribeUrl, logoUrl }: RenderInput): RenderedEmail {
  const personal = applyName(body.replace(/\r\n/g, "\n").trim(), firstName(name));

  const paragraphs = personal
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#27272a;">${linkify(
          escapeHtml(p)
        ).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  const logo = escapeHtml(logoUrl || DEFAULT_LOGO_URL);

  const footerHtml = unsubscribeUrl
    ? `Bu e-postayı, Nebula'da yenilik ve kampanya iletileri almayı kabul ettiğin için aldın.
       Artık almak istemiyorsan <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6366f1;">abonelikten çık</a>.`
    : `Bu e-postayı, Nebula'da yenilik ve kampanya iletileri almayı kabul ettiğin için aldın.`;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(safeSubject(subject))}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr><td style="padding:0 0 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:12px;"><tr>
          <td style="padding:12px 18px;"><img src="${logo}" alt="Nebula" height="28" style="display:block;height:28px;width:auto;border:0;font-size:18px;font-weight:800;color:#ffffff;"></td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:28px;">
        ${paragraphs}
      </td></tr>
      <tr><td style="padding:16px 4px 0;font-size:12px;line-height:1.6;color:#71717a;">${footerHtml}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    personal,
    "",
    "--",
    "Bu e-postayı, Nebula'da yenilik ve kampanya iletileri almayı kabul ettiğin için aldın.",
    unsubscribeUrl ? `Abonelikten çık: ${unsubscribeUrl}` : "",
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");

  return { html, text };
}
