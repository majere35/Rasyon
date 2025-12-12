import { ChefHat, Wallet, Target, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';
import { SettingsModal } from './SettingsModal';

interface MobileNavProps {
    activeTab: 'recipes' | 'targets' | 'balance';
    onTabChange: (tab: 'recipes' | 'targets' | 'balance') => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const navItems = [
        { id: 'recipes', icon: ChefHat, label: 'Reçete' },
        { id: 'targets', icon: Target, label: 'Hedef' },
        { id: 'balance', icon: Wallet, label: 'Bilanço' },
    ] as const;

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#18181b] border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe transition-colors">
                <div className="flex items-center justify-around p-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={twMerge(
                                clsx(
                                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                                    activeTab === item.id
                                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                                        : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                )
                            )}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}

                    {/* Settings Button */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all w-16"
                    >
                        <Settings size={20} />
                        <span className="text-[10px] font-medium">Ayarlar</span>
                    </button>
                </div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
