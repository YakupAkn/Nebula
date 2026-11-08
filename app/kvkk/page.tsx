import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni | Nebula" };

export default function KvkkPage() {
  return (
    <LegalPage title="Kişisel Verilerin Korunması Aydınlatma Metni">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (“KVKK”) 10. maddesi ve Aydınlatma Yükümlülüğünün
        Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında, Nebula'yı kullanırken kişisel
        verilerinin nasıl işlendiğini anlatır. Bilgilendirme amaçlıdır; onay veya rıza gerektirmez.
      </p>

      <Section title="1. Veri sorumlusu">
        <p>
          Veri sorumlusu: {LEGAL.controllerName}
          <br />
          Adres: {LEGAL.address}
          <br />
          İletişim: {LEGAL.email}
        </p>
      </Section>

      <Section title="2. İşlenen kişisel veriler">
        <ul className="list-disc space-y-1 pl-5">
          <li>Kimlik: ad soyad</li>
          <li>İletişim: e-posta adresi</li>
          <li>Hesap ve profil: profil fotoğrafı (Google ile girişte Google'dan gelir), rolün, ekip bilgileri, Nebula'yı nereden duyduğun</li>
          <li>Kullanıcı içeriği: organizasyon, proje, görev, yorum ve atama bilgileri</li>
          <li>İşlem güvenliği: IP adresi, tarayıcı ve cihaz bilgisi, oturum kayıtları</li>
          <li>Kullanım ölçümü: yalnızca analitik çerezlerine izin verirsen sayfa görüntüleme ve etkileşim verileri</li>
        </ul>
      </Section>

      <Section title="3. İşleme amaçları ve hukuki sebepler">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hesabını oluşturmak, giriş yapmanı sağlamak ve hizmeti sunmak: sözleşmenin kurulması veya ifası (KVKK m.5/2-c)</li>
          <li>Güvenliği sağlamak, kötüye kullanımı önlemek, hukuki yükümlülükleri yerine getirmek: hukuki yükümlülük (m.5/2-ç) ve meşru menfaat (m.5/2-f)</li>
          <li>Ürünü geliştirmek ve onboarding yanıtlarını ürün kararlarında kullanmak: meşru menfaat (m.5/2-f)</li>
          <li>Pazarlama iletisi göndermek (ileride yapılırsa): açık rıza (m.5/1). Bu rıza ayrıca ve isteğe bağlı olarak sorulur.</li>
          <li>Analitik çerezleri: açık rıza (m.5/1). Çerez banner'ında ayrıca sorulur.</li>
        </ul>
      </Section>

      <Section title="4. Toplama yöntemi">
        <p>
          Verilerin; kayıt ve giriş formları, Google ile giriş, profil tamamlama ekranı ve hizmeti kullanırken oluşan
          kayıtlar aracılığıyla, otomatik veya kısmen otomatik yollarla elektronik ortamda toplanır.
        </p>
      </Section>

      <Section title="5. Verilerin aktarılması">
        <p>Verilerin yalnızca hizmetin sunulması için gerekli olduğu ölçüde şu taraflarla paylaşılır:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Aynı organizasyon ve projedeki diğer kullanıcılar: ad soyad, profil fotoğrafı ve görev içerikleri</li>
          <li>Altyapı hizmet sağlayıcıları: Supabase (veritabanı ve kimlik doğrulama, Almanya/AB veri merkezi), Vercel (barındırma, ABD)</li>
          <li>Google (Google ile giriş yaparsan; analitik çerezlerine izin verirsen Google Analytics)</li>
          <li>Yetkili kamu kurum ve kuruluşları: yalnızca hukuken zorunlu olduğunda</li>
        </ul>
        <p>
          Bu sağlayıcılar yurt dışında bulunduğundan veriler yurt dışına aktarılır. Aktarım KVKK m.9 kapsamında,
          yeterlilik kararı, standart sözleşme gibi uygun güvencelerden biri veya kanunda sayılan diğer şartlar
          çerçevesinde yapılır.
        </p>
      </Section>

      <Section title="6. Saklama süresi">
        <p>
          Verilerin hesabın açık olduğu sürece saklanır. Profil sayfasındaki “Hesabı Sil” ile hesabını silebilirsin.
          Kanunen daha uzun saklamamız gereken kayıtlar, ilgili süre dolana kadar saklanır ve sonra silinir, yok edilir
          veya anonim hale getirilir.
        </p>
      </Section>

      <Section title="7. KVKK m.11 kapsamındaki haklarınız">
        <ul className="list-disc space-y-1 pl-5">
          <li>Kişisel verinin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme ve bunun aktarılan üçüncü kişilere bildirilmesini isteme</li>
          <li>İşlenen verinin otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etme</li>
          <li>Kanuna aykırı işlenmesi nedeniyle zarara uğrarsan zararın giderilmesini talep etme</li>
        </ul>
        <p>
          Başvurularını {LEGAL.email} adresine yazılı olarak iletebilirsin. Talebin niteliğine göre en geç otuz gün
          içinde yanıt verilir. Cevabı yetersiz bulursan Kişisel Verileri Koruma Kurulu'na şikayet hakkın saklıdır.
        </p>
      </Section>
    </LegalPage>
  );
}
