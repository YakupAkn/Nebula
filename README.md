# Nebula Proje ve Takım Yönetim Sistemi

Nebula, çevik ekipler için geliştirilmiş, gerçek zamanlı veri senkronizasyonuna sahip bir Kanban panosudur.

## Temel Özellikler
- Gerçek Zamanlı Senkronizasyon: Supabase Realtime ile yapılan tüm değişiklikler tüm kullanıcılara anında yansır.
- Pürüzsüz Etkileşim: Dnd-kit altyapısı ile optimize edilmiş sürükle-bırak deneyimi.
- İyimser Güncellemeler: Veritabanı yanıtı beklenmeden işlemler arayüzde anında işlenir.
- Dinamik Form Yönetimi: Ekran düzenini bozmayan açılır görev ekleme paneli.
- Modern Arayüz: TypeScript ve Tailwind CSS ile geliştirilmiş responsive tasarım.

## Teknolojiler
- Framework: Next.js
- Veritabanı ve Realtime: Supabase
- Stil: Tailwind CSS
- Sürükle-Bırak: @dnd-kit

## Kurulum

1. Bagımlılıkları yükleyin:
```bash
npm install
.env.local dosyanızı oluşturun ve Supabase bilgilerinizi girin:

Plaintext
NEXT_PUBLIC_SUPABASE_URL=proje_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key
Sunucuyu başlatın:

Bash
npm run dev
Lisans
Bu proje açık kaynaklıdır.

## E-posta duyuruları (admin)

Yöneticiler `/admin` sayfasından, e-posta almayı kabul etmiş kullanıcılara duyuru gönderebilir.
Gönderim Next.js API route'ları + nodemailer ile, Supabase Magic Link'te kullandığın SMTP üzerinden yapılır.

1. `supabase/migrations/20261109180000_announcements.sql` dosyasını çalıştır, sonra kendini admin yap:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'senin@epostan.com');
   ```
2. Sunucu ortam değişkenlerini tanımla (`NEXT_PUBLIC_` ile **başlatma**, tarayıcıya gitmemeli):

   | Değişken | Açıklama |
   | --- | --- |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (RLS'i aşar, gizli tut) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Magic Link'te kullandığın SMTP bilgileri (port 465 SSL ya da 587) |
   | `SMTP_FROM` | Gönderen, örn. `Nebula <ornek@alanadi.com>` (boşsa `SMTP_USER`) |
   | `SMTP_REPLY_TO` | İsteğe bağlı: yanıtların gideceği adres |
   | `NEWSLETTER_SECRET` | Abonelik iptal bağlantılarını imzalayan rastgele değer (en az 16 karakter) |
   | `SITE_URL` | Sitenin canlı adresi, örn. `https://nebula.app` (e-postadaki bağlantılar için) |

3. `/admin` sayfasında önce **Test gönder (bana)** ile kendine dene, sonra gönder.

Notlar: Onayı olmayan kullanıcıya hiçbir zaman duyuru gitmez. Her e-postada abonelikten çık bağlantısı
(`/abonelik-iptal`) bulunur. Kullanıcı iptal edince `marketing_consent` kapanır. Gmail gibi SMTP'lerin
günlük gönderim limiti vardır (Gmail ~500/gün); kullanıcı sayın büyürse Resend/SES gibi bir servise geçmek gerekir.
