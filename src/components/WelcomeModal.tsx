import { useState, useEffect } from 'react';
import { Building2, User, Save, ChefHat } from 'lucide-react';
import { useStore } from '../store/useStore';

export function WelcomeModal() {
    const { company, setCompany, isConfigOpen, toggleConfig } = useStore();
    const [name, setName] = useState('');
    const [officialName, setOfficialName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [type, setType] = useState<'limited' | 'sahis'>('sahis');

    // Prefill data when Config is opened or Company updates (if config is open)
    useEffect(() => {
        if (company && isConfigOpen) {
            setName(company.name);
            setOfficialName(company.officialName);
            setOwnerName(company.ownerName || '');
            setType(company.type);
        }
    }, [company, isConfigOpen]);

    // Derived state for visibility - NOT a conditional return before hooks
    const shouldShow = (!company) || isConfigOpen;

    const handleSave = () => {
        if (!name || !officialName || !ownerName) return;
        setCompany({ name, officialName, ownerName, type });
        // Close config if it was open
        if (isConfigOpen) {
            toggleConfig(false);
        }
    };

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="flex flex-col items-center text-center mb-6 relative z-10">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                        <ChefHat size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">RASYON'a Hoşgeldiniz</h2>
                    <p className="text-zinc-400 text-sm">Finansal takibinizi profesyonelleştirmek için şirketinizi tanıyalım.</p>
                </div>

                <div className="space-y-4 relative z-10">
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 ml-1">İşletme Adı</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Örn: Burger Station"
                            className="mt-1 w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-zinc-500 ml-1">Resmi Ticari Ünvan</label>
                        <input
                            type="text"
                            placeholder="Örn: Yılmaz Gıda Turizm Ltd. Şti."
                            className="mt-1 w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                            value={officialName}
                            onChange={(e) => setOfficialName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-zinc-500 ml-1">İşletme Yetkilisi</label>
                        <input
                            type="text"
                            placeholder="Örn: Ahmet Yılmaz"
                            className="mt-1 w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-zinc-500 ml-1">Şirket Tipi</label>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <button
                                onClick={() => setType('sahis')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${type === 'sahis'
                                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                        : 'border-zinc-800 bg-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800'
                                    }`}
                            >
                                <User size={24} className="mb-2" />
                                <span className="font-bold text-sm">Şahıs Şirketi</span>
                                <span className="text-[10px] opacity-60 mt-0.5">Artan Oranlı Vergi</span>
                            </button>

                            <button
                                onClick={() => setType('limited')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${type === 'limited'
                                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                        : 'border-zinc-800 bg-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800'
                                    }`}
                            >
                                <Building2 size={24} className="mb-2" />
                                <span className="font-bold text-sm">Limited / A.Ş.</span>
                                <span className="text-[10px] opacity-60 mt-0.5">Sabit %25 Vergi</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!name || !officialName || !ownerName}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                        <Save size={18} />
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
