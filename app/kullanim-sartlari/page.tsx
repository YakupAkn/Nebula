import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Kullanım Şartları | Nebula" };

export default function TermsPage() {
  return (
    <LegalPage title="Kullanım Şartları">
      <p>
        Nebula'yı (“Hizmet”) kullanarak bu şartları kabul etmiş olursun. Hizmeti sunan: {LEGAL.controllerName}
        (“Nebula”). İletişim: {LEGAL.email}
      </p>

      <Section title="1. Hizmet">
        <p>
          Nebula, ekiplerin proje ve görevlerini Kanban panosunda yönettiği çevrim içi bir araçtır. Hizmet geliştirilmeye
          devam eder; özellikler zamanla eklenebilir, değiştirilebilir veya kaldırılabilir.
        </p>
      </Section>

      <Section title="2. Hesap ve güvenlik">
        <ul className="list-disc space-y-1 pl-5">
          <li>Doğru ve güncel bilgi vermekle yükümlüsün.</li>
          <li>Hesabının ve giriş yöntemlerinin güvenliğinden sen sorumlusun. Yetkisiz kullanımı fark edersen bize bildir.</li>
          <li>18 yaşından küçükler Hizmeti yasal temsilcisinin bilgisi ve onayı ile kullanabilir.</li>
        </ul>
      </Section>

      <Section title="3. Senin içeriğin">
        <p>
          Projeler, görevler ve yorumlar gibi oluşturduğun içeriklerin sahibi sensin. Hizmeti sunabilmemiz için bu
          içerikleri saklamamıza, işlememize ve aynı organizasyondaki yetkili kullanıcılara göstermemize izin verirsin.
          İçeriklerin hukuka uygunluğundan sen sorumlusun.
        </p>
      </Section>

      <Section title="4. Kabul edilemez kullanım">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hukuka aykırı, hakaret, nefret veya tehdit içeren içerik yüklemek</li>
          <li>Başkalarının hesaplarına veya verilerine izinsiz erişmeye çalışmak</li>
          <li>Hizmetin işleyişini bozacak yük bindirmek, otomatik saldırı veya tarama yapmak</li>
          <li>Hizmeti tersine mühendislikle çözmeye çalışmak veya telif haklarını ihlal etmek</li>
        </ul>
        <p>Bu kuralların ihlalinde hesabın uyarı yapılarak veya doğrudan askıya alınabilir ya da kapatılabilir.</p>
      </Section>

      <Section title="5. Planlar ve ücretler">
        <p>
          Free plan ücretsizdir. Ücretli planlar (Pro, Business) için ödeme altyapısı devreye alındığında fiyatlar,
          vergiler ve cayma hakkı gibi şartlar satın alma öncesinde ayrıca ve açıkça gösterilir; bu şartlar ayrı bir
          Mesafeli Satış Sözleşmesi ile düzenlenir.
        </p>
      </Section>

      <Section title="6. Fikri mülkiyet">
        <p>
          Nebula'nın yazılımı, tasarımı ve markası Nebula'ya aittir. Bu şartlar sana bunları kopyalama, satma veya
          türev eser üretme hakkı vermez; yalnızca Hizmeti kullanma hakkı verir.
        </p>
      </Section>

      <Section title="7. Sorumluluk">
        <p>
          Hizmet “olduğu gibi” sunulur. Kesintisiz veya hatasız çalışacağı garanti edilmez. Kasıt ve ağır kusur halleri ile
          kanunen sınırlanamayan sorumluluklar saklı kalmak üzere, Nebula dolaylı zararlardan ve veri kaybından sorumlu
          tutulamaz. Önemli verilerini ayrıca yedeklemeni öneririz.
        </p>
      </Section>

      <Section title="8. Hesabı kapatma">
        <p>
          Profil sayfasından hesabını istediğin zaman silebilirsin. Biz de bu şartların ihlali halinde hesabı
          kapatabiliriz. Kişisel verilerin KVKK Aydınlatma Metni'ne göre işlenir ve saklanır.
        </p>
      </Section>

      <Section title="9. Değişiklikler">
        <p>
          Şartları güncelleyebiliriz. Önemli değişikliklerde Hizmet içinde bildirim yapar ve gerekiyorsa yeniden onayını
          isteriz. Güncel metin her zaman bu sayfadadır.
        </p>
      </Section>

      <Section title="10. Uygulanacak hukuk ve yetki">
        <p>
          Bu şartlara Türk hukuku uygulanır. Uyuşmazlıklarda, tüketici sayılan kullanıcılar için 6502 sayılı Tüketicinin
          Korunması Hakkında Kanun'daki yetkili tüketici hakem heyetleri ve tüketici mahkemeleri; diğer kullanıcılar için
          veri sorumlusunun yerleşim yeri mahkemeleri ve icra daireleri yetkilidir.
        </p>
      </Section>
    </LegalPage>
  );
}
