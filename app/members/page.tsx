"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Şemana uygun arayüz (Interface) tanımlamaları
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface OrgMember {
  id: string; // organization_members tablosundaki id
  user_id: string;
  role: string;
  profiles: Profile; // Supabase'den gelen ilişkili profil verisi
}

// Sisteme kayıtlı tüm kullanıcıları çekmek için (Ekleme dropdown'ı için)
interface SystemUser {
  id: string;
  full_name: string | null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState("Üye");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sabit bir organizasyon ID'si varsayıyoruz. 
  // (Eğer dinamikse bunu Context'ten veya URL'den almalısın)
  const CURRENT_ORG_ID = "ad8efd6b-2e0a-4ef6-a563-db1674073e69";

  useEffect(() => {
    fetchMembers();
    fetchSystemUsers();
  }, []);

  // 1. Mevcut Organizasyon Üyelerini Çek (Profiles tablosuyla JOIN yaparak)
  const fetchMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        role,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq("organization_id", CURRENT_ORG_ID);

    if (error) {
      setErrorMessage("Üyeler yüklenirken hata oluştu.");
      console.error(error);
    } else {
      // Supabase'den gelen veriyi tipe uygun hale getiriyoruz
      setMembers(data as unknown as OrgMember[]);
    }
    setIsLoading(false);
  };

  // 2. Sisteme Kayıtlı Tüm Kullanıcıları Çek (Yeni üye seçimi için)
  const fetchSystemUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name");
      
    if (!error && data) {
      setSystemUsers(data);
    }
  };

  // 3. Organizasyona Yeni Üye Ekle (UUID bazlı)
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMessage("Lütfen eklenecek bir kullanıcı seçin.");
      return;
    }

    setErrorMessage(null);

    // Seçilen kişi zaten organizasyonda mı?
    const isExist = members.some((m) => m.user_id === selectedUserId);
    if (isExist) {
      setErrorMessage("Bu kullanıcı zaten organizasyonunuzda mevcut.");
      return;
    }

    const { error } = await supabase
      .from("organization_members")
      .insert([
        { 
          organization_id: CURRENT_ORG_ID, 
          user_id: selectedUserId, 
          role: newRole 
        }
      ]);

    if (error) {
      setErrorMessage("Üye eklenirken bir hata oluştu.");
      console.error(error);
    } else {
      // Başarılı olursa listeyi yenile
      fetchMembers();
      setSelectedUserId(""); 
    }
  };

  // 4. Organizasyondan Üye Çıkar
  const handleRemoveMember = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`${name} isimli üyeyi organizasyondan çıkarmak istediğinize emin misiniz?`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage("Üye silinirken bir hata oluştu.");
      console.error(error);
    } else {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Üst Kısım */}
        <div className="mb-8">
          <Link href="/" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
            ← Panoya Geri Dön
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Organizasyon Üyeleri</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistemdeki kullanıcıları organizasyonunuza dahil edin ve yetkilerini yönetin.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm mb-6 flex justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Yeni Üye Ekleme Formu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Organizasyona Kullanıcı Ekle</h2>
          <form onSubmit={handleAddMember} className="flex gap-4 items-end flex-wrap">
            
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-semibold text-slate-500 mb-2">Kullanıcı Seç (Profiles Tablosundan)</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white"
              >
                <option value="">-- Bir Kullanıcı Seçin --</option>
                {systemUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || "İsimsiz Kullanıcı"}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-500 mb-2">Rol</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm bg-white"
              >
                <option value="admin">Admin</option>
                <option value="member">Üye</option>
                <option value="viewer">Gözlemci</option>
              </select>
            </div>

            <button type="submit" className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors h-[42px]">
              Ekle
            </button>
          </form>
        </div>

        {/* Mevcut Üyeler Listesi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Mevcut Üyeler ({members.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Üyeler yükleniyor...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Bu organizasyonda henüz üye bulunmuyor.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {member.profiles?.avatar_url ? (
                      <img src={member.profiles.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center uppercase">
                        {(member.profiles?.full_name || "X").charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{member.profiles?.full_name || "İsimsiz Kullanıcı"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
                      {member.role}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.profiles?.full_name || "Kullanıcı")}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all text-xs font-medium"
                    >
                      Çıkar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}