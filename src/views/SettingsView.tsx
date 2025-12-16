import { useState, useRef } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, FileJson } from 'lucide-react';
import { useStore } from '../store/useStore';

export function SettingsView() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [importMessage, setImportMessage] = useState('');

    const handleExport = () => {
        const state = useStore.getState();
        // Sadece kalici olmasi gereken verileri aliyoruz
        const dataToExport = {
            recipes: state.recipes,
            salesTargets: state.salesTargets,
            expenses: state.expenses,
            company: state.company,
            daysWorkedInMonth: state.daysWorkedInMonth,
            packagingCosts: state.packagingCosts,
            rawIngredients: state.rawIngredients,
            ingredientCategories: state.ingredientCategories,
            theme: state.theme,
            exportDate: new Date().toISOString(),
            version: '1.2'
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rasyon_yedek_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basit bir dogrulama
                if (!data.recipes || !Array.isArray(data.recipes)) {
                    throw new Error("Geçersiz yedek dosyası formatı.");
                }

                // Veriyi store'a yükle
                useStore.setState({
                    recipes: data.recipes,
                    salesTargets: data.salesTargets || [],
                    expenses: data.expenses || [],
                    company: data.company || null,
                    daysWorkedInMonth: data.daysWorkedInMonth || 26,
                    packagingCosts: data.packagingCosts || [],
                    rawIngredients: data.rawIngredients || [],
                    ingredientCategories: data.ingredientCategories || [],
                    theme: data.theme || 'dark'
                });

                setImportStatus('success');
                setImportMessage(`Başarıyla yüklendi! ${data.recipes.length} reçete kurtarıldı.`);

                // Sayfayi yenile ki her sey yerine otursun
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error("Import error:", error);
                setImportStatus('error');
                setImportMessage("Dosya okunamadı veya format hatalı.");
            }
        };
        reader.readAsText(file);
    };

    const handleClearData = () => {
        if (confirm("DİKKAT! Tüm verileriniz kalıcı olarak silinecektir. Emin misiniz?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Veri Yönetimi</h1>
                <p className="text-zinc-500">
                    Ağ sorunları nedeniyle buluta erişemediğiniz durumlarda verilerinizi buradan yedekleyip başka cihaza aktarabilirsiniz.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                        <Download size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Verileri Yedekle (İndir)</h3>
                    <p className="text-sm text-zinc-500 mb-6">
                        Şu anki tüm reçete, hammadde ve gider verilerinizi `.json` dosyası olarak bilgisayarınıza indirir.
                    </p>
                    <button
                        onClick={handleExport}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <FileJson size={18} />
                        Dosyayı İndir
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                        <Upload size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Yedekten Yükle</h3>
                    <p className="text-sm text-zinc-500 mb-6">
                        Daha önce indirdiğiniz `.json` yedek dosyasını seçerek verilerinizi geri yükleyin.
                    </p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />

                    <button
                        onClick={handleImportClick}
                        className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700"
                    >
                        <Upload size={18} />
                        Dosya Seç ve Yükle
                    </button>

                    {importStatus === 'success' && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in">
                            <CheckCircle size={16} />
                            {importMessage}
                        </div>
                    )}
                    {importStatus === 'error' && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-600 text-sm font-medium animate-in fade-in">
                            <AlertTriangle size={16} />
                            {importMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm mt-8">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400">
                        <Trash2 size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Verileri Sıfırla</h3>
                        <p className="text-sm text-zinc-500 mb-4">
                            Tarayıcıdaki tüm verileri temizler. Bu işlem geri alınamaz. Lütfen önce yedek aldığınızdan emin olun.
                        </p>
                        <button
                            onClick={handleClearData}
                            className="px-4 py-2 bg-white dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                        >
                            Verileri Temizle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
