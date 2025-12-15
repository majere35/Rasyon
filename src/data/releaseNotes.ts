export interface ReleaseNote {
    version: string;
    date?: string; // Optional for now
    changes: string[];
}

export const releaseNotes: ReleaseNote[] = [
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
