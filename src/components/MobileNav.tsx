import { ChefHat, Wallet, Menu as MenuIcon, LayoutList, X, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { useStore } from '../store/useStore';
import type { ActiveTab } from '../layouts/DashboardLayout';

interface MobileNavProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, setUser } = useStore();

    // Mapping for grouping
    const isFinanceActive = ['targets', 'balance', 'monthly_accounting'].includes(activeTab);

    const handleFinanceClick = () => {
        // Default to 'balance' (Projeksiyon) when clicking Finans
        if (!isFinanceActive) {
            onTabChange('balance');
        }
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#18181b] border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe transition-colors">
                <div className="flex items-center justify-around p-2">
                    {/* 1. STOK */}
                    <button
                        onClick={() => onTabChange('ingredients')}
                        className={twMerge(
                            clsx(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                                activeTab === 'ingredients'
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                            )
                        )}
                    >
                        <LayoutList size={20} />
                        <span className="text-[10px] font-medium">Stok</span>
                    </button>

                    {/* 2. RECETELER */}
                    <button
                        onClick={() => onTabChange('recipes')}
                        className={twMerge(
                            clsx(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                                activeTab === 'recipes'
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                            )
                        )}
                    >
                        <ChefHat size={20} />
                        <span className="text-[10px] font-medium">Reçeteler</span>
                    </button>

                    {/* 3. FINANS */}
                    <button
                        onClick={handleFinanceClick}
                        className={twMerge(
                            clsx(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                                isFinanceActive
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                            )
                        )}
                    >
                        <Wallet size={20} />
                        <span className="text-[10px] font-medium">Finans</span>
                    </button>

                    {/* 4. MENU */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className={twMerge(
                            clsx(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                                isMenuOpen
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 flow-root"
                            )
                        )}
                    >
                        <MenuIcon size={20} />
                        <span className="text-[10px] font-medium">Menü</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer/Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl p-6 pb-safe animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Menü</h3>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {/* Settings */}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsSettingsOpen(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-200 font-medium active:scale-95 transition-transform"
                            >
                                <Settings size={20} className="text-zinc-500" />
                                Ayarlar
                            </button>

                            {/* Admin (Conditional) */}
                            {user?.email === 'ayyildiz.ata@gmail.com' && (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onTabChange('admin_dashboard');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100 font-medium active:scale-95 transition-transform"
                                >
                                    <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400" />
                                    Admin Panel
                                </button>
                            )}

                            {/* Logout */}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setUser(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-medium active:scale-95 transition-transform"
                            >
                                <LogOut size={20} className="text-red-500" />
                                Çıkış Yap
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <span className="text-xs text-zinc-400">Rasyon v1.1 Mobile</span>
                        </div>
                    </div>
                </div>
            )}

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
