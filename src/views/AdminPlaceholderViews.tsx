import { FileBarChart, Settings } from 'lucide-react';

export function AdminReportsView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <FileBarChart className="text-zinc-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Raporlar Hazırlanıyor</h3>
            <p className="text-zinc-500 max-w-sm">Bu modül bir sonraki güncellemede (v1.1) aktif olacaktır. Detaylı finansal analizler ve PDF çıktıları burada yer alacak.</p>
        </div>
    );
}

export function AdminSettingsView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Settings className="text-zinc-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Yönetici Ayarları</h3>
            <p className="text-zinc-500 max-w-sm">Sistem genelindeki katsayılar, varsayılanlar ve global bildirimler buradan yönetilecek.</p>
        </div>
    );
}
