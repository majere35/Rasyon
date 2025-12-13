import { useState } from 'react';
import { ChefHat, Wallet, Target, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store/useStore';
import { SettingsModal } from './SettingsModal';
import { APP_VERSION } from '../config';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { toggleConfig, user, company } = useStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const menuItems = [
        { id: 'recipes', label: 'Reçeteler', icon: ChefHat },
        { id: 'targets', label: 'Satış Hedefi', icon: Target },
        { id: 'balance', label: 'Aylık Bilanço', icon: Wallet },
    ] as const;

    return (
        <div className="w-64 h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex flex-col border-r border-zinc-200 dark:border-zinc-800 shadow-2xl relative transition-colors">
            {/* Header / Logo - Clickable for Config */}
            <div
                className="p-6 flex items-center gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group"
                onClick={() => toggleConfig(true)}
                title="Şirket Ayarlarını Düzenle"
            >
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                    <ChefHat size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-zinc-900 dark:text-white tracking-tight">RASYON</h1>
                </div>
            </div>

            {/* Custom Greeting Section */}
            <div className="px-6 mb-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-150">
                <div className="text-xs text-zinc-500 font-medium">Merhaba,</div>
                <div className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                    {company?.ownerName || user?.displayName || 'İşletme Yetkilisi'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1 leading-tight">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {company?.name || 'İşletme'}
                    </span>
                    {' '}Yönetim Ekranına Hoşgeldin.
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={twMerge(
                            clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                                activeTab === item.id
                                    ? "bg-indigo-50/50 dark:bg-gradient-to-r dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-700 font-bold dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            )
                        )}
                    >
                        <item.icon size={18} className={activeTab === item.id ? "text-indigo-700 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"} />
                        {item.label}
                        {activeTab === item.id && (
                            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="px-3 pb-2 space-y-1">
                {/* Admin Sub-Menu (Only for specific user) */}
                {/* Note: In a real app, use user?.uid or a helper. Here we check email hardcoded as per v1.0.4 requirement */}
                {useStore.getState().user?.email === 'ayyildiz.ata@gmail.com' && (
                    <div className="mb-2">
                        {/* Accordion Trigger */}
                        <button
                            onClick={() => activeTab.startsWith('admin') ? onTabChange(menuItems[0].id) : onTabChange('admin_dashboard' as any)}
                            className={twMerge(
                                clsx(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                    activeTab.startsWith('admin')
                                        ? "bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 font-bold dark:text-amber-500 border border-amber-200 dark:border-amber-500/20"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-500/10"
                                )
                            )}
                        >
                            <ShieldCheck size={18} />
                            <span>Admin Panel</span>
                            {activeTab.startsWith('admin') && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                        </button>

                        {/* Sub Items */}
                        <div className={`space-y-1 pl-9 overflow-hidden transition-all duration-500 ease-in-out ${activeTab.startsWith('admin') ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                            <button onClick={() => onTabChange('admin_dashboard' as any)} className={`w-full text-left py-1.5 text-xs font-medium transition-colors ${activeTab === 'admin_dashboard' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                                Panel
                            </button>
                            <button onClick={() => onTabChange('admin_users' as any)} className={`w-full text-left py-1.5 text-xs font-medium transition-colors ${activeTab === 'admin_users' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                                Kullanıcı Yönetimi
                            </button>
                            <button onClick={() => onTabChange('admin_reports' as any)} className={`w-full text-left py-1.5 text-xs font-medium transition-colors ${activeTab === 'admin_reports' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                                Raporlar
                            </button>
                            <button onClick={() => onTabChange('admin_settings' as any)} className={`w-full text-left py-1.5 text-xs font-medium transition-colors ${activeTab === 'admin_settings' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                                Admin Ayarları
                            </button>
                        </div>
                    </div>
                )}

                {/* Settings Button */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all group"
                >
                    <Settings size={18} className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                    Ayarlar
                </button>

                {/* Logout Button */}
                <button
                    onClick={() => useStore.getState().setUser(null)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-80 hover:opacity-100"
                >
                    <LogOut size={18} className="text-red-500" />
                    Çıkış Yap
                </button>
            </div>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-500 font-medium">Created by Ata Ayyıldız</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-0.5">2025 RASYON {APP_VERSION}</div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
