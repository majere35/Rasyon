export interface ReleaseNote {
    version: string;
    date?: string; // Optional for now
    changes: string[];
}

export const releaseNotes: ReleaseNote[] = [
    {
        version: '1.2.6',
        date: '2026-01-03',
        changes: [
            '📊 Pazar Analizi: Yeni modül - rakip fiyatlarını karşılaştırın, pozisyonunuzu analiz edin.',
            '🍟 Dahil Eklentiler: Patates ve içecek dahil mi işaretleyin, analiz tablosunda emojilerle görün.',
            '🔍 Akıllı Autocomplete: Rakip isimlerinde önceden girilenleri hatırlayan autocomplete.',
            '📈 Karşılaştırma Tablosu: Tüm rakipler yan yana, ortalama fiyat, yüzde fark gösterimi.',
            '🎨 UI İyileştirmeleri: Dropdown ve sayı girişleri diğer sayfalarla tutarlı hale getirildi.'
        ]
    },
    {
        version: '1.2.5',
        date: '2025-12-24',
        changes: [
            '🧾 Fatura Özeti (Nakit Akışı): Tüm gider ekranlarında KDV oranlarına (%1, %10, %20) göre kırılım ve "Cebinizden Çıkan Gerçek Toplam Nakit" gösterimi eklendi.',
            '📊 KDV Dahil Toplam Gider: Aylık Bilanço ve Gerçekleşen Hesaplar sayfalarındaki KDV özet bölümüne yeni satır eklendi.',
            '🧹 Bilanço Sayfa Temizliği: Projeksiyon sayfasındaki şirket ve marka adı göstergesi kaldırıldı, sayfa daha ferah bir görünüme kavuştu.',
            '🏷️ Reçete Grupları Yönetimi: Reçetelerinizi kategorilere (gruplar) ayırın, grup renklerini belirleyin ve sırasını istediğiniz gibi yönetin.',
            '📦 Kompakt Ara Ürün Kartları: Ara ürün reçete kartlarının yüksekliği azaltılarak daha fazla ürünün aynı anda ekranda görülmesi sağlandı.'
        ]
    },
    {
        version: '1.2.4',
        date: '2025-12-23',
        changes: [
            'Gelişmiş PDF raporlama sistemi eklendi',
            'Özet ve Detaylı rapor seçenekleri',
            'Yazıcı dostu siyah/beyaz rapor şablonu',
            'Rapor footer alanında oluşturulma tarihi gösterimi'
        ]
    },
    {
        version: '1.2.3',
        date: '23 Aralık 2025',
        changes: [
            '🧪 Ara Ürün Desteği: Soslar, karışımlar gibi ara ürünlerin reçetelerini oluşturun ve ana ürünlerde kullanın.',
            '📦 Ambalaj Bazlı Fiyatlandırma: Hammadde eklerken artık kutu/kova boyutunu ve fiyatını girin, birim fiyat otomatik hesaplansın.',
            '✨ Otomatik Büyük Harf: Tüm ürün ve malzeme isimlerinde her kelimenin ilk harfi otomatik büyük yazılıyor.',
            '🚫 Tekrar Önleme: Aynı isimde hammadde eklemeye artık izin verilmiyor.',
            '🏷️ Yeni Başlık: "Restoran Maliyet Yönetimi" - daha profesyonel bir isim.',
            '🐛 Vergi Düzeltmesi: Zarar döneminde negatif vergi hesaplaması sorunu giderildi.',
            '🐛 Stopaj Düzeltmesi: Çift stopaj sayımı hatası düzeltildi.',
            '📊 Kategori Sistemi: Gider kategorileri merkezi hale getirildi, kelime bazlı eşleştirme kaldırıldı.'
        ]
    },
    {
        version: '1.2.2',
        date: '20 Aralık 2025',
        changes: [
            'Projeksiyon Sihirbazı (BalanceView): Gider silme işlemi için onay penceresi eklendi.',
            'Gerçekleşen Hesaplar (MonthlyAccountingView): KDV seçim menüsünün arka plan rengi düzeltildi.',
            'Finansal Özet: Projeksiyon ve Aylık Bilanço ekranlarına kâr marjı (%) ve vergi sonrası net kâr (%) göstergeleri eklendi.',
            'UI İyileştirmeleri: Sayı giriş alanlarındaki ok işaretleri kaldırıldı, genel görünüm iyileştirildi.'
        ]
    },
    {
        version: '1.2.1',
        date: '17.12.2025',
        changes: [
            'Gerçekleşen Hesaplar Modülü: Yeni sekme yapısı (Gider -> Gelir -> Bilanço).',
            'Otomatik Kayıt Sistemi: Artık manuel kaydetmeye gerek yok.',
            'UI İyileştirmeleri: Modern onay pencereleri ve optimize edilmiş formlar.',
            'Bilanço: 15 standart kategori ve online komisyon hesaplaması.'
        ]
    },
    {
        version: 'v1.2.0',
        date: '17.12.2025',
        changes: [
            'Gerçekleşen Hesaplar Modülü: Yeni sekme yapısı (Gider -> Gelir -> Bilanço).',
            'Otomatik Kayıt Sistemi: Artık manuel kaydetmeye gerek yok.',
            'UI İyileştirmeleri: Modern onay pencereleri ve optimize edilmiş formlar.',
            'Bilanço: 15 standart kategori ve online komisyon hesaplaması.'
        ]
    },
    {
        version: 'v1.1.2',
        changes: [
            "Kategoriler için 16'lı renk paleti eklendi.",
            "Reçeteden Kopyala özelliği eklendi (mevcut içeriği değiştirir).",
            "Sabit Satış Fiyatı mantığı: Maliyet değiştiğinde fiyat sabit kalır, kâr oranı güncellenir.",
            "Malzeme düzenleme ekranında kategori değiştirme özelliği eklendi.",
            "Reçete miktar alanı genişletildi (0,0002 desteği)."
        ]
    },
    {
        version: '1.1.11',
        date: '15.12.2025',
        changes: [
            'Kritik arayüz hatası (SettingsModal) giderildi.',
            'Uygulama paketleme sorunu çözüldü.'
        ]
    },
    {
        version: '1.1.10',
        date: '15.12.2025',
        changes: [
            'Ayarlar menüsü ve butonlar tamamen düzeltildi.',
            'Arayüz bileşenleri tekrar kontrol edildi.'
        ]
    },
    {
        version: '1.1.9',
        date: '15.12.2025',
        changes: [
            'Ayarlar menüsü arayüz hatası giderildi.',
            'Manuel senkronizasyon kontrolleri stabil hale getirildi.'
        ]
    },
    {
        version: '1.1.8',
        date: '15.12.2025',
        changes: [
            'Ayarlar menüsüne manuel "Buluta Yükle / İndir" butonları eklendi.',
            'Cihazlar arası zorunlu senkronizasyon özelliği getirildi.'
        ]
    },
    {
        version: '1.1.7',
        date: '15.12.2025',
        changes: [
            'Şirket bilgilerinin senkronizasyonu iyileştirildi.',
            'Veri algılama hassasiyeti artırıldı.'
        ]
    },
    {
        version: '1.1.6',
        date: '15.12.2025',
        changes: [
            'Bulut senkronizasyonu algoritması iyileştirildi (Mevcut verileri koruma).',
            'İlk kurulumda veri kaybını önleyen kontroller eklendi.'
        ]
    },
    {
        version: '1.1.5',
        date: '15.12.2025',
        changes: [
            'Genel dağıtım stabilizasyonu.',
            'Veri senkronizasyonu için son kontroller.'
        ]
    },
    {
        version: 'v1.1.4',
        date: '15.12.2025',
        changes: [
            'Cihazlar arası veri senkronizasyonu düzeltildi (Masaüstü -> Mobil aktarımı).',
            'Hammaddelerin buluta kaydedilmemesi sorunu giderildi.'
        ]
    },
    {
        version: 'v1.1.2',
        date: '15.12.2025',
        changes: [
            'Vercel dağıtımı için yol ayarı (path) düzeltildi.',
            'Dağıtım ortamı iyileştirmeleri.'
        ]
    },
    {
        version: 'v1.1.1',
        date: '15.12.2025',
        changes: [
            'Satış Hedefleri tablosu sütun genişlikleri optimize edildi (Ürün adı genişletildi).',
            'Kira gideri için KDV/Stopaj seçimi modern toggle switch ile değiştirildi.',
            'Malzeme silme uyarısı modern modal arayüzüne taşındı.',
            'Hostinger dağıtımı için altyapı düzenlemeleri yapıldı.',
            'Genel performans ve arayüz iyileştirmeleri.'
        ]
    },
    {
        version: 'v1.1.0',
        changes: [
            'Vergi: Kurumlar Vergisi hesaplaması "Net Kâr (%25)" üzerinden yapılmak üzere güncellendi.',
            'Vergi: Kira Giderleri için KDV (%20) / Stopaj (%20 Net\'ten Brüt\'e) seçimi eklendi.',
            'Vergi: Finansal Özet tablosuna "Ödenecek Toplam Vergi" (Kurumlar + KDV + Stopaj) satırı eklendi.',
            'Arayüz: Tablolar daha kompakt hale getirildi, boşluklar azaltıldı.',
            'Arayüz: KDV ve Stopaj butonları eklendi.'
        ]
    },
    {
        version: 'v1.0.9',
        changes: [
            'Aylık Bilanço: Paket servis cirosu ve maliyetleri hesaplamaya dahil edildi.',
            'Aylık Bilanço: Finansal Özet kartına detaylı gider kırılımı eklendi.',
            'Düzeltme: Ambalaj maliyetinin restoran satışlarına yansıması engellendi.',
            'Arayüz: Vergi ve Özet tabloları daha kompakt hale getirildi.',
            'Düzeltme: Ürün seçim menüsünde (Dropdown) kaydırma sorunu giderildi.'
        ]
    },
    {
        version: 'v1.0.8',
        changes: [
            'Satış Hedefleri: "Günlük Adet" → "Restoran" ve "Paket" olarak ayrıldı.',
            'Ambalaj maliyeti sadece paket satışlarına yansıtılacak şekilde güncellendi.',
            'Tablo düzeni sabitlendi, büyük sayılarda kayma sorunu giderildi.',
            'Sayı girişleri (input) için özel tasarım (oklar) eklendi.',
            'Açılır menülerde taşma sorunu (clipping) düzeltildi.',
            'Sürüm notları altyapısı yenilendi ve otomatikleştirildi.'
        ]
    },
    {
        version: 'v1.0.7',
        changes: [
            'Özel tasarım kaydırma çubukları eklendi.',
            'Satış Hedefleri için modern açılır menü (searchable dropdown) eklendi.',
            'Arayüz genelinde görsel iyileştirmeler yapıldı.'
        ]
    },
    {
        version: 'v1.0.6',
        changes: [
            'Para birimi formatı standartlaştırıldı (102.204,00 ₺).',
            'Reçete kartlarındaki çarpan değeri yuvarlandı.',
            'Sürüm numarası dinamik hale getirildi.'
        ]
    },
    {
        version: 'v1.0.4',
        changes: [
            'Admin Paneli eklendi (Canlı istatistikler, Kullanıcı Takibi).',
            'Kayıt ve Giriş ekranları yenilendi.'
        ]
    }
];
