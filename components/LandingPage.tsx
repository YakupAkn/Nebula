import React from 'react';
import { useTheme } from './ThemeProvider';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-md py-4 px-6 flex justify-between items-center transition-colors ${isDark ? 'bg-black/80 border-[#222]' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 flex items-center justify-center font-black rounded-2xl text-xl transition-colors ${isDark ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}>
            N
          </div>
          <span className="font-bold text-2xl tracking-tighter">Nebula</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'border-[#222] hover:bg-zinc-900' : 'border-zinc-200 hover:bg-zinc-100'}`}
            aria-label="Tema değiştir"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button 
            onClick={onStart} 
            className={`px-6 py-2.5 rounded-2xl font-semibold text-sm transition-all ${isDark ? 'bg-[#0070f3] hover:bg-[#0060d6]' : 'bg-zinc-900 hover:bg-black'} text-white`}
          >
            Giriş Yap
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-20">
        <section className="text-center mb-20">
          <div className={`inline-block px-4 py-1.5 mb-8 rounded-full text-xs font-medium tracking-widest border ${isDark ? 'border-[#222] text-[#888]' : 'border-zinc-200 text-zinc-500'}`}>
            YENİ NESİL PROJE YÖNETİMİ
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tighter mb-8">
            Karmaşıklığı{' '}
            <span className="text-[#0070f3]">Basitleştir</span>
          </h1>

          <p className={`max-w-lg mx-auto text-lg leading-relaxed ${isDark ? 'text-[#aaa]' : 'text-zinc-600'}`}>
            Yazılım ve donanım ekiplerine özel tasarlanmış, hız odaklı ve sezgisel bir proje yönetim platformu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <button 
              onClick={onStart}
              className="bg-white text-black px-10 py-4 rounded-3xl font-semibold text-lg hover:bg-zinc-100 active:scale-95 transition-all"
            >
              Hemen Başla
            </button>
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className={`px-8 py-4 rounded-3xl font-medium border transition-all ${isDark ? 'border-[#222] hover:bg-zinc-900' : 'border-zinc-300 hover:bg-zinc-100'}`}
            >
              Demo İzle
            </button>
          </div>
        </section>

        {/* === YENİ DEMO BÖLÜMÜ === */}
        <section id="demo" className="mb-28">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3">Nasıl Görünüyor?</h2>
            <p className={`text-lg ${isDark ? 'text-[#888]' : 'text-zinc-600'}`}>
              Gerçek uygulamadan alınmış canlı önizleme
            </p>
          </div>

          {/* Demo Kanban Mockup */}
          <div className={`border rounded-3xl p-8 overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kolon 1 */}
              <div className={`rounded-2xl p-5 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="font-semibold">Yapılacaklar</span>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">4</span>
                </div>
                <div className="space-y-3">
                  {["API endpoint'leri oluştur", "Login sayfası tasarımı", "Veritabanı şeması"].map((title, i) => (
                    <div key={i} className={`p-4 rounded-xl text-sm ${isDark ? 'bg-zinc-800' : 'bg-white shadow-sm'}`}>
                      {title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kolon 2 */}
              <div className={`rounded-2xl p-5 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="font-semibold">Devam Edenler</span>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">3</span>
                </div>
                <div className="space-y-3">
                  {["Authentication sistemi", "Drag & Drop optimizasyonu"].map((title, i) => (
                    <div key={i} className={`p-4 rounded-xl text-sm border border-amber-500/30 ${isDark ? 'bg-zinc-800' : 'bg-white shadow-sm'}`}>
                      {title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kolon 3 */}
              <div className={`rounded-2xl p-5 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="font-semibold">Tamamlananlar</span>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">7</span>
                </div>
                <div className="space-y-3 opacity-75">
                  {["Landing page tasarımı", "Supabase entegrasyonu"].map((title, i) => (
                    <div key={i} className={`p-4 rounded-xl text-sm line-through ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                      {title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Bu sadece bir önizleme • Gerçek uygulamada sürükle-bırak, gerçek zamanlı güncelleme ve daha fazlası mevcut
              </p>
            </div>
          </div>
        </section>

        {/* Özellikler ve Neden Nebula bölümleri (önceki halinden korunmuş) */}
        <section id="features" className="grid md:grid-cols-2 gap-6 mb-28">
          {/* ... mevcut özellik kartları aynı kalabilir ... */}
          {[
            { title: "Kanban Engine", desc: "Gelişmiş sürükle-bırak arayüzü ile görevleri kolayca yönetin." },
            { title: "Gerçek Zamanlı Team Sync", desc: "Tüm ekip üyeleri aynı anda aynı veriyi görür." },
            { title: "Gelişmiş Data Insights", desc: "Burndown chart'lar ve performans metrikleri." },
            { title: "Güvenlik Odaklı", desc: "End-to-end şifreleme ve rol bazlı erişim." }
          ].map((feature, index) => (
            <div key={index} className={`group p-9 rounded-3xl border transition-all hover:-translate-y-1 ${isDark ? 'bg-[#111] border-[#222] hover:border-[#0070f3]/40' : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'}`}>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className={`leading-relaxed ${isDark ? 'text-[#aaa]' : 'text-zinc-600'}`}>{feature.desc}</p>
            </div>
          ))}
        </section>

        {/* Neden Nebula Bölümü */}
        <section className={`p-12 md:p-16 rounded-3xl mb-20 ${isDark ? 'bg-[#111] border border-[#222]' : 'bg-white border border-zinc-200 shadow'}`}>
          <h2 className="text-4xl font-bold mb-10">Neden Nebula?</h2>
          <div className="space-y-8 max-w-2xl">
            {[
              "Tasarımından kodlamasına kadar geliştirici deneyimi ön planda",
              "Gerçek zamanlı işbirliği ile toplantıları azaltır",
              "Detaylı raporlama ve öngörü araçları",
              "Modern ve temiz arayüz"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-1 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border ${isDark ? 'border-[#0070f3]' : 'border-zinc-400'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#0070f3]' : 'bg-zinc-700'}`} />
                </div>
                <p className={`text-lg ${isDark ? 'text-[#ccc]' : 'text-zinc-700'}`}>{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={`border-t py-14 text-center ${isDark ? 'border-[#222] text-[#666]' : 'border-zinc-200 text-zinc-500'}`}>
        <p className="text-sm">© 2026 Nebula OS. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}