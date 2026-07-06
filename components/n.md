# Birleştirilmiş Dosyalar Raporu

**Toplam Dosya Sayısı:** 11
---

## 1. Dosya: AssigneeDropdown.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/AssigneeDropdown.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { maskEmail, getInitials } from "@/utils/user";

interface MemberProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string; // Gösterim için mock veya ilişkili tablodan gelen email
}

interface AssigneeDropdownProps {
  organizationId: string;
  currentAssigneeId: string | null;
  onAssign: (userId: string | null) => void;
}

export default function AssigneeDropdown({ organizationId, currentAssigneeId, onAssign }: AssigneeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dışarı tıklanınca kapatma işlevi
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchOrganizationMembers();
  }, [organizationId, currentAssigneeId]);

  const fetchOrganizationMembers = async () => {
    try {
      setLoading(true);
      // Organizasyona bağlı üyelerin profil bilgilerini çekiyoruz
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          user_id,
          profiles:user_id (id, full_name, avatar_url)
        `)
        .eq("organization_id", organizationId);

      if (error) throw error;

      const formattedMembers: MemberProfile[] = (data || []).map((m: any) => ({
        id: m.profiles?.id,
        full_name: m.profiles?.full_name || "Bilinmeyen Üye",
        avatar_url: m.profiles?.avatar_url,
        email: "user" + m.user_id.slice(0, 3) + "@company.com" // Projenizdeki gerçek email alanıyla değiştirilebilir
      }));

      setMembers(formattedMembers);

      if (currentAssigneeId) {
        const current = formattedMembers.find(m => m.id === currentAssigneeId);
        if (current) setSelectedMember(current);
      } else {
        setSelectedMember(null);
      }
    } catch (err) {
      console.error("Üyeler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (member: MemberProfile | null) => {
    setSelectedMember(member);
    onAssign(member ? member.id : null);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-1.5">
        Görevli
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#0d0d12] border border-zinc-800 rounded-lg text-sm text-zinc-200 hover:border-zinc-700 transition-colors focus:outline-none"
      >
        {selectedMember ? (
          <div className="flex items-center gap-2 text-left">
            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300">
              {selectedMember.avatar_url ? (
                <img src={selectedMember.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(selectedMember.full_name)
              )}
            </div>
            <span className="font-medium text-zinc-200 truncate">{selectedMember.full_name}</span>
          </div>
        ) : (
          <span className="text-zinc-500">Atanmamış</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-zinc-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-[#0d0d12] border border-zinc-800 rounded-xl shadow-2xl z-50 py-1 max-h-60 overflow-y-auto backdrop-blur-xl">
          {/* Atamayı Kaldır Seçeneği */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full flex items-center px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300 text-left transition-colors"
          >
            Atamayı Kaldır
          </button>
          
          <div className="h-[1px] bg-zinc-800/60 my-1" />

          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-900/80 text-left transition-colors group border-b border-zinc-900/40 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(member.full_name)
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                  {member.full_name}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {maskEmail(member.email || "")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 2. Dosya: Column.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/Column.tsx`

### Dosya İçeriği:
```tsx
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  title: string;
  tasks: any[];
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: any) => void;
}

export function Column({ title, tasks, onDeleteTask, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <div className="flex flex-col bg-slate-100/60 p-4 rounded-2xl border border-slate-200/60 w-full min-h-[650px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            title === "Yapılacaklar" ? "bg-indigo-500" : title === "Devam Edenler" ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          <h2 className="font-semibold text-slate-700 text-sm tracking-tight">{title}</h2>
        </div>
        <span className="bg-slate-200/80 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onTaskClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
```

---

## 3. Dosya: LandingPage.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/LandingPage.tsx`

### Dosya İçeriği:
```tsx
import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

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
```

---

## 4. Dosya: Login.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/Login.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StarBackground from "./StarBackground";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginMethod, setLoginMethod] = useState<"magic" | "password">("magic");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [needsProfile, setNeedsProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          const googleName = session.user.user_metadata?.full_name;
          if (googleName) {
            await supabase.from("profiles").insert([{ id: session.user.id, full_name: googleName }]);
            window.location.reload();
          } else {
            setNeedsProfile(true);
          }
        }
      }
    };

    checkSession();
  }, []);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      window.location.reload();
    }
  };

  const handleGoogleLogin = async () => {
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !userId) return;

    setStatus("loading");
    const { error } = await supabase
      .from("profiles")
      .insert([{ id: userId, full_name: fullName.trim() }]);

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setNeedsProfile(false);
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30">
      <StarBackground />

      <div className="w-full max-w-md bg-[#0d0d12]/60 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {needsProfile ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Profilini Tamamla</h1>
              <p className="text-zinc-400 text-xs mt-1.5">Sistemde ekibinle uyumlu çalışabilmek için adını soyadını girmelisin.</p>
            </div>

            <form onSubmit={handleProfileComplete} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Yakup Delil"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">
                  {errorMessage || "Profil kaydedilemedi."}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
              >
                Kaydet ve Devam Et
              </button>
            </form>
          </div>
        ) : status === "sent" ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Giriş bağlantısı gönderildi</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              <span className="text-zinc-200 font-medium">{email}</span> adresine bir bağlantı ilettik.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-zinc-500 font-medium mt-6 hover:text-zinc-300 transition-colors underline underline-offset-4"
            >
              Farklı bir e-posta dene
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-400">
                Nebula
              </h1>
              <p className="text-zinc-400 text-xs mt-2 font-normal">
                Ekip görev akışını yönetmek için giriş yap.
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={status === "loading"}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google ile Devam Et
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800/80"></div>
              </div>
              <span className="relative bg-[#0d0d12] px-3 text-[10px] uppercase font-medium tracking-widest text-zinc-500">
                veya e-posta
              </span>
            </div>

            {/* Giriş Yöntemi Seçici Sekmeler */}
            <div className="flex border-b border-zinc-800 mb-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLoginMethod("magic")}
                className={`flex-1 pb-2 text-center border-b-2 transition-colors ${loginMethod === "magic" ? "border-zinc-200 text-zinc-200" : "border-transparent text-zinc-500"}`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`flex-1 pb-2 text-center border-b-2 transition-colors ${loginMethod === "password" ? "border-zinc-200 text-zinc-200" : "border-transparent text-zinc-500"}`}
              >
                Şifre (Hızlı Test)
              </button>
            </div>

            {loginMethod === "magic" ? (
              /* Magic Link Formu */
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="isim@sirket.com"
                    className="w-full px-4 py-2.5 text-sm bg-zinc-950/40 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">
                    {errorMessage || "Bir hata oluştu."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
                >
                  {status === "loading" ? "Gönderiliyor..." : "Giriş Bağlantısı Gönder"}
                </button>
              </form>
            ) : (
              /* Hızlı Test Şifre Formu */
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@nebula.com"
                    className="w-full px-4 py-2.5 text-sm bg-zinc-950/40 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-sm bg-zinc-950/40 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-600 transition-colors"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium">
                    {errorMessage || "Giriş başarısız."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
                >
                  {status === "loading" ? "Giriş Yapılıyor..." : "Şifre ile Giriş Yap"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 5. Dosya: OrgMembers.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/OrgMembers.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface OrgMembersProps {
  organizationId: string;
  onClose: () => void;
}

export function OrgMembers({ organizationId, onClose }: OrgMembersProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "not_found" | "error">("idle");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    const { data: users, error: searchError } = await supabase.rpc("find_user_by_email", {
      search_email: email.trim(),
    });

    if (searchError || !users || users.length === 0) {
      setStatus("not_found");
      return;
    }

    const foundUser = users[0];

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert([{ organization_id: organizationId, user_id: foundUser.id, role: "member" }]);

    if (insertError) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-slate-900">Üye Ekle</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddMember} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ekip.arkadasi@mail.com"
              autoFocus
              className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Eklenecek kişinin Nebula'ya bu e-posta ile en az bir kez giriş yapmış olması gerekir.
            </p>
          </div>

          {status === "not_found" && (
            <p className="text-xs text-rose-600 font-medium">
              Bu e-posta ile kayıtlı bir kullanıcı bulunamadı. Önce kişinin giriş yapması gerekiyor.
            </p>
          )}
          {status === "error" && (
            <p className="text-xs text-rose-600 font-medium">
              Ekleme başarısız oldu — zaten üye olabilir.
            </p>
          )}
          {status === "success" && (
            <p className="text-xs text-emerald-600 font-medium">Üye eklendi.</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            {status === "loading" ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 6. Dosya: OrgSetup.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/OrgSetup.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface OrgSetupProps {
  session: Session;
  onOrgCreated: () => void;
}

export function OrgSetup({ session, onOrgCreated }: OrgSetupProps) {
  const [mode, setMode] = useState<"choice" | "create" | "waiting">("choice");
  const [orgName, setOrgName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert([{ name: orgName, created_by: session.user.id }])
      .select()
      .single();

    if (orgError || !org) {
      setStatus("error");
      setErrorMsg("Organizasyon oluşturulamadı, tekrar dene.");
      return;
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert([{ organization_id: org.id, user_id: session.user.id, role: "owner" }]);

    if (memberError) {
      setStatus("error");
      setErrorMsg("Üyelik oluşturulamadı, tekrar dene.");
      return;
    }

    onOrgCreated();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nebula</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {session.user.email}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {mode === "choice" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center mb-4">
                Henüz bir organizasyona ait değilsin.
              </p>
              <button
                onClick={() => setMode("create")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                Yeni Organizasyon Oluştur
              </button>
              <button
                onClick={() => setMode("waiting")}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all border border-slate-200"
              >
                Davet Bekliyorum
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Organizasyon Adı
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="ör. Deneyap Ekibi"
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                {status === "loading" ? "Oluşturuluyor..." : "Oluştur"}
              </button>
              <button
                type="button"
                onClick={() => setMode("choice")}
                className="w-full text-xs text-slate-400 font-semibold hover:text-slate-600"
              >
                Geri
              </button>
            </form>
          )}

          {mode === "waiting" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">Davet bekleniyor</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Organizasyon sahibinin seni <span className="font-medium">{session.user.email}</span> adresinle eklemesini bekle. Eklendiğinde sayfayı yenile.
              </p>
              <button
                onClick={() => setMode("choice")}
                className="text-xs text-indigo-600 font-semibold mt-4 hover:underline"
              >
                Geri
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Dosya: ProjectSetup.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/ProjectSetup.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface Project {
  id: string;
  name: string;
}

interface OrgMember {
  user_id: string;
  email: string;
}

interface ProjectSetupProps {
  session: Session;
  organizationId: string;
  onProjectSelected: (projectId: string) => void;
}

export function ProjectSetup({ session, organizationId, onProjectSelected }: ProjectSetupProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([session.user.id]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const fetchOrgMembers = async () => {
    const { data: memberRows } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId);

    if (!memberRows || memberRows.length === 0) {
      setOrgMembers([]);
      return;
    }

    const userIds = memberRows.map((m: any) => m.user_id);

    const { data: users, error } = await supabase.rpc("get_users_by_ids", {
      user_ids: userIds,
    });

    if (!error && users) {
      setOrgMembers(users.map((u: any) => ({ user_id: u.id, email: u.email })));
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchOrgMembers();
  }, [organizationId]);

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setStatus("loading");

    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert([{ name: projectName, organization_id: organizationId, created_by: session.user.id }])
      .select()
      .single();

    if (projError || !project) {
      setStatus("error");
      return;
    }

    const memberIds = Array.from(new Set([...selectedMemberIds, session.user.id]));

    const { error: memberError } = await supabase
      .from("project_members")
      .insert(memberIds.map((userId) => ({ project_id: project.id, user_id: userId })));

    if (memberError) {
      setStatus("error");
      return;
    }

    onProjectSelected(project.id);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nebula</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Bir proje seç ya da yeni oluştur.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {mode === "list" && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">Henüz bir proje yok.</p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onProjectSelected(p.id)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-sm font-medium text-slate-800"
                  >
                    {p.name}
                  </button>
                ))
              )}

              <button
                onClick={() => setMode("create")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all mt-3"
              >
                Yeni Proje Oluştur
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Proje Adı
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="ör. TerraGuard"
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/50 rounded-lg focus:outline-none border border-slate-200 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Projeye Dahil Olacaklar
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {orgMembers.map((member) => (
                    <label
                      key={member.user_id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.user_id)}
                        onChange={() => toggleMember(member.user_id)}
                        disabled={member.user_id === session.user.id}
                        className="accent-indigo-600"
                      />
                      {member.user_id === session.user.id ? "Sen" : member.email}
                    </label>
                  ))}
                </div>
              </div>

              {status === "error" && (
                <p className="text-xs text-rose-600 font-medium">Bir şeyler ters gitti, tekrar dene.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
              >
                {status === "loading" ? "Oluşturuluyor..." : "Oluştur"}
              </button>
              <button
                type="button"
                onClick={() => setMode("list")}
                className="w-full text-xs text-slate-400 font-semibold hover:text-slate-600"
              >
                Geri
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Dosya: StarBackground.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/StarBackground.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useEffect, useRef } from "react";

export default function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{ x: number; y: number; radius: number; vx: number; vy: number; alpha: number }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 10000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.2 + 0.5,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.5 + 0.3,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Nebula derinlik hissi için hafif arka plan gradyan parlamaları
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 10,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      gradient.addColorStop(0, "#09090b");
      gradient.addColorStop(0.5, "#0b0813");
      gradient.addColorStop(1, "#020204");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Yıldızları çizdir ve hareket ettir
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fill();

        s.x += s.vx;
        s.y += s.vy;

        if (s.x < 0 || s.x > canvas.width) s.vx = -s.vx;
        if (s.y < 0 || s.y > canvas.height) s.vy = -s.vy;

        // Yakın yıldızlar arasında çok hafif nebula bağları/çizgileri oluşturma
        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const dist = Math.hypot(s.x - s2.x, s.y - s2.y);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 block pointer-events-none" />;
}
```

---

## 9. Dosya: TaskCard.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/TaskCard.tsx`

### Dosya İçeriği:
```tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
  description: string | null;
  due_date: string | null;
  assignee: string | null;
}

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function isOverdue(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  return date < today;
}

export function TaskCard({ task, onDelete, onTaskClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)",
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? "1.03" : "1",
  };

  const tagColors: Record<string, string> = {
    "Rapor": "bg-amber-50 text-amber-700 border border-amber-200",
    "Donanım": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Yazılım": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };

  const overdue = task.due_date ? isOverdue(task.due_date) : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-400/50 transition-all cursor-grab active:cursor-grabbing group relative select-none"
    >
      <div className="flex justify-between items-center mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${tagColors[task.tag] || "bg-slate-100 text-slate-700"}`}>
          {task.tag}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if(confirm("Bu görevi silmek istediğine emin misin?")) onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 transition-all duration-200"
          title="Görevi Sil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      <div className="w-full h-full pointer-events-none">
        <h3 className="font-medium text-slate-800 text-[14px] leading-snug tracking-tight">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {(task.assignee || task.due_date) && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            {task.assignee ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                  {task.assignee.charAt(0)}
                </span>
                {task.assignee}
              </span>
            ) : <span />}

            {task.due_date && (
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                overdue ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
              }`}>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 10. Dosya: TaskCardMember.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/TaskCardMember.tsx`

### Dosya İçeriği:
```tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Eğer lib klasörü de kök dizindeyse
import { getInitials } from "../utils/user";   // Kök dizindeki utils/user.ts dosyasına erişim

interface TaskCardMemberProps {
  assigneeId: string | null;
}

export default function TaskCardMember({ assigneeId }: TaskCardMemberProps) {
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assigneeId) {
      setProfile(null);
      return;
    }

    const fetchAssigneeProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", assigneeId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchAssigneeProfile();
  }, [assigneeId]);

  if (!assigneeId || loading) {
    return (
      <div className="flex items-center gap-1.5 opacity-40">
        <div className="w-5 h-5 rounded-full border border-dashed border-zinc-700 bg-transparent" />
        <span className="text-[11px] text-zinc-500">Atanmamış</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800/60 rounded-full pl-1 pr-2.5 py-0.5 max-w-max select-none">
      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300 shrink-0 shadow-inner">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(profile?.full_name || "Kullanıcı")
        )}
      </div>
      <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[100px]">
        {profile?.full_name || "Yükleniyor..."}
      </span>
    </div>
  );
}
```

---

## 11. Dosya: TaskModal.tsx
**Tam Yol Dizini:** `C:/Users/yakup/Şablonlar/nebula/components/TaskModal.tsx`

### Dosya İçeriği:
```tsx

interface Task {
  id: string;
  title: string;
  status: string;
  tag: string;
  description: string | null;
  due_date: string | null;
  assignee: string | null;
}

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, description: string) => void;
  onUpdateMeta: (
    id: string,
    updates: { due_date?: string | null; assignee?: string | null }
  ) => void;
  orgMembers: string[];
}

export function TaskModal({ task, onClose, onUpdate, onUpdateMeta, orgMembers }: TaskModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {task.tag}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Atanan Kişi</label>
            <select
              value={task.assignee || ""}
              onChange={(e) => onUpdateMeta(task.id, { assignee: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-800 bg-slate-50/50"
            >
              {orgMembers.length === 0 ? (
                <option value={task.assignee || ""}>{task.assignee || "Atanmadı"}</option>
              ) : (
                <>
                  {task.assignee && !orgMembers.includes(task.assignee) && (
                    <option value={task.assignee}>{task.assignee}</option>
                  )}
                  {orgMembers.map((member) => (
                    <option key={member} value={member}>
                      {member.split("@")[0]}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Son Teslim Tarihi</label>
            <input
              type="date"
              value={task.due_date || ""}
              onChange={(e) => onUpdateMeta(task.id, { due_date: e.target.value || null })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-800 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Görev Açıklaması</label>
          <textarea
            defaultValue={task.description || ""}
            placeholder="Bu görev için detaylı bir açıklama yazın..."
            className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm text-slate-800 bg-slate-50/50 resize-none"
            onBlur={(e) => onUpdate(task.id, e.target.value)}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 text-sm transition-all shadow-sm"
        >
          Kapat ve Kaydet
        </button>
      </div>
    </div>
  );
}
```

---

