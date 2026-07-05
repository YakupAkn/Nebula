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