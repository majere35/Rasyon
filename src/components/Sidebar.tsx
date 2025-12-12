import { LayoutDashboard, ChefHat, Wallet, Target } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
    activeTab: 'recipes' | 'targets' | 'balance';
    onTabChange: (tab: 'recipes' | 'targets' | 'balance') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const menuItems = [
        { id: 'recipes', label: 'Reçeteler', icon: ChefHat },
        { id: 'targets', label: 'Satış Hedefi', icon: Target },
        { id: 'balance', label: 'Aylık Bilanço', icon: Wallet },
    ] as const;

    return (
        <div className="w-64 h-screen bg-zinc-900 text-white flex flex-col border-r border-zinc-800 shadow-2xl">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <LayoutDashboard size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    RestoApp
                </h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={twMerge(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-indigo-600/20 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white hover:pl-5"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-white transition-colors")} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 text-center">
                    v1.0.0 • Developed by Antigravity
                </div>
            </div>
        </div>
    );
}
