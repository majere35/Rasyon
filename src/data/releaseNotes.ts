export interface ReleaseNote {
    version: string;
    date?: string; // Optional for now
    changes: string[];
}

export const releaseNotes: ReleaseNote[] = [
    {
        version: 'v1.0.8',
        changes: [
            'Satış Hedefleri: "Günlük Adet" → "Restoran" ve "Paket" olarak ayrıldı.',
            'Ambalaj maliyeti sadece paket satışlarına yansıtılacak şekilde güncellendi.',
            'Tablo düzeni sabitlendi, büyük sayılarda kayma sorunu giderildi.',
            'Sayı girişleri (input) için özel tasarım (oklar) eklendi.',
            'Açılır menülerde taşma sorunu (clipping) düzeltildi.'
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
