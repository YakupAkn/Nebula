import os
from tkinter import Tk, filedialog

def markdown_birlestir():
    # Tkinter arayüzünü gizli olarak başlat
    root = Tk()
    root.withdraw()
    root.attributes('-topmost', True) # Pencereyi öne getir

    print("Lütfen birleştirmek istediğiniz dosyaları seçin...")
    
    # Kullanıcıya dosya seçtir (Çoklu seçime izin verir)
    dosya_yollari = filedialog.askopenfilenames(
        title="Birleştirilecek Dosyaları Seçin",
        filetypes=[("Tüm Dosyalar", "*.*")]
    )

    if not dosya_yollari:
        print("Herhangi bir dosya seçilmedi. İşlem iptal edildi.")
        return

    # Çıktı klasörünü ve dosya adını belirle (İlk seçilen dosyanın yanına kaydeder)
    ilk_dosya_dizini = os.path.dirname(dosya_yollari[0])
    cikti_dosyasi = os.path.join(ilk_dosya_dizini, "birlestirilmis_dosyalar.md")

    with open(cikti_dosyasi, "w", encoding="utf-8") as f_cikti:
        # Markdown Başlığı
        f_cikti.write("# Birleştirilmiş Dosyalar Raporu\n\n")
        f_cikti.write(f"**Toplam Dosya Sayısı:** {len(dosya_yollari)}\n")
        f_cikti.write("---\n\n")

        for sira, dosya_yolu in enumerate(dosya_yollari, 1):
            dosya_adi = os.path.basename(dosya_yolu)
            uzanti = dosya_adi.split('.')[-1] if '.' in dosya_adi else ''
            
            print(f"İşleniyor ({sira}/{len(dosya_yollari)}): {dosya_adi}")

            # Dosya Başlığı ve Yol Dizini
            f_cikti.write(f"## {sira}. Dosya: {dosya_adi}\n")
            f_cikti.write(f"**Tam Yol Dizini:** `{dosya_yolu}`\n\n")
            f_cikti.write("### Dosya İçeriği:\n")
            
            # Markdown kod blokları için ilgili dili veya düz metni ayarla
            f_cikti.write(f"```{uzanti}\n")

            try:
                # Dosya içeriğini oku ve yaz
                with open(dosya_yolu, "r", encoding="utf-8", errors="replace") as f_girdi:
                    icerik = f_girdi.read()
                    f_cikti.write(icerik)
            except Exception as e:
                f_cikti.write(f"[HATA: Dosya okunurken bir sorun oluştu -> {str(e)}]")

            f_cikti.write("\n```\n\n")
            f_cikti.write("---\n\n") # Dosyalar arasına çizgi çek

    print(f"\nBaşarılı! Tüm dosyalar şuraya kaydedildi:\n{cikti_dosyasi}")

if __name__ == "__main__":
    markdown_birlestir()