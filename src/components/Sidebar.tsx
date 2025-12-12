import { useState } from 'react';
import { ChefHat, Wallet, Target, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store/useStore';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
    activeTab: 'recipes' | 'targets' | 'balance';
    onTabChange: (tab: 'recipes' | 'targets' | 'balance') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { toggleConfig } = useStore();
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
                    <span className="text-[10px] text-zinc-500 font-bold tracking-wider">v1.0.0</span>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-3 py-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={twMerge(
                            clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === item.id
                                    ? "bg-indigo-50/50 dark:bg-gradient-to-r dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            )
                        )}
                    >
                        <item.icon size={18} className={activeTab === item.id ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Settings Button (Bottom) */}
            <div className="px-3 pb-2">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all group"
                >
                    <Settings size={18} className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                    Ayarlar
                </button>
            </div>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-500 font-medium">Created by Ata Ayyıldız</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-0.5">2025 RASYON v1.0.0</div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
