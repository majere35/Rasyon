import { useState } from 'react';
import { X, Moon, Sun, ScrollText, Book } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, toggleTheme } = useStore();
    const [subModal, setSubModal] = useState<'instructions' | 'release' | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden transition-colors">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ayarlar</h2>
                        <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors">
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-500" />}
                                <div>
                                    <div className="font-medium text-zinc-900 dark:text-white">Görünüm</div>
                                    <div className="text-xs text-zinc-500">{theme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}</div>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        {/* Instructions */}
                        <button
                            onClick={() => setSubModal('instructions')}
                            className="w-full flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                            <Book size={20} className="text-green-500 dark:text-green-400" />
                            <div>
                                <div className="font-medium text-zinc-900 dark:text-white">Kullanım Talimatları</div>
                                <div className="text-xs text-zinc-500">Uygulama rehberi ve ipuçları</div>
                            </div>
                        </button>

                        {/* Release Notes */}
                        <button
                            onClick={() => setSubModal('release')}
                            className="w-full flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                            <ScrollText size={20} className="text-blue-500 dark:text-blue-400" />
                            <div>
                                <div className="font-medium text-zinc-900 dark:text-white">Sürüm Notları</div>
                                <div className="text-xs text-zinc-500">v1.0.0 değişiklikleri</div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 text-center border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white mb-1">RASYON v1.0.0</div>
                        <div className="text-[10px] text-zinc-500">Created by Ata Ayyıldız</div>
                    </div>
                </div>
            </div>

            {/* Sub Modals - Independent and Centered */}
            {subModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                {subModal === 'instructions' ? 'Kullanım Talimatları' : 'Sürüm Notları'}
                            </h2>
                            <button onClick={() => setSubModal(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 text-zinc-600 dark:text-zinc-300 text-sm space-y-4 max-h-[60vh] overflow-y-auto">
                            {subModal === 'instructions' ? (
                                <>
                                    <p><strong className="text-zinc-900 dark:text-white">RASYON</strong>, restoran ve kafeler için geliştirilmiş akıllı bir finansal yönetim aracıdır.</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong className="text-zinc-900 dark:text-white">Reçeteler:</strong> Ürünlerinizin maliyetini hesaplayın. Akıllı fiyat çarpanı ile ideal satış fiyatınızı belirleyin.</li>
                                        <li><strong className="text-zinc-900 dark:text-white">Satış Hedefi:</strong> Günlük tahmini satış adetlerini girerek aylık ciro ve hammadde ihtiyacını görün.</li>
                                        <li><strong className="text-zinc-900 dark:text-white">Bilanço:</strong> Sabit giderlerinizi, personel maaşlarını ve diğer harcamaları girerek gerçek net kârınızı görün.</li>
                                        <li><strong className="text-zinc-900 dark:text-white">Vergi Analizi:</strong> Şirket tipinize (Şahıs/Limited) göre tahmini gelir vergisi ve KDV hesaplamasını otomatik takip edin.</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                v1.0.0 <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded">YENİ</span>
                                            </div>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                                                <li>Marka kimliği <strong>RASYON</strong> olarak güncellendi.</li>
                                                <li>Giriş ekranı (İşletme Yetkilisi) eklendi.</li>
                                                <li>Fiyat girişleri ve maliyet çarpanı iyileştirildi.</li>
                                                <li>Vergi sonrası net kâr analizi düzeltildi.</li>
                                            </ul>
                                        </div>
                                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                            <div className="font-bold text-zinc-500">v0.7</div>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-zinc-500">
                                                <li>Reçete fiyatlarında çift yönlü düzenleme.</li>
                                                <li>KDV %1 Gıda düzeltmesi.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
