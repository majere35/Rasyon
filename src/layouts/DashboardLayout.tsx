import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { useStore } from '../store/useStore';
import { ChefHat } from 'lucide-react';
import { clsx } from 'clsx';

export type ActiveTab = 'pos' | 'recipes' | 'ingredients' | 'targets' | 'balance' | 'monthly_accounting' | 'market_analysis' | 'admin_dashboard' | 'admin_users' | 'admin_reports' | 'admin_settings';

interface DashboardLayoutProps {
    children: (activeTab: ActiveTab) => React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
        const saved = localStorage.getItem('activeTab');
        return (saved as ActiveTab) || 'recipes';
    });

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
    };

    const { toggleConfig } = useStore();

    // Finance Sub-Tabs
    const isFinanceTab = ['targets', 'balance', 'monthly_accounting'].includes(activeTab);
    const financeTabs = [
        { id: 'targets', label: 'Hedef' },
        { id: 'balance', label: 'Projeksiyon' },
        { id: 'monthly_accounting', label: 'Gerçekleşen' },
    ] as const;

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-[#0f0f11] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300">

            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden md:block">
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800 z-40 flex items-center px-4 justify-between transition-colors shadow-sm">
                <div className="flex items-center gap-3" onClick={() => toggleConfig(true)}>
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ChefHat size={18} className="text-white" />
                    </div>
                    <h1 className="font-bold text-zinc-900 dark:text-white tracking-tight">RASYON</h1>
                </div>
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-full">v1.1</div>
            </div>

            {/* Mobile Top Sub-Nav (Finance Only) */}
            {isFinanceTab && (
                <div className="md:hidden fixed top-16 left-0 right-0 h-12 bg-zinc-50 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 z-30 flex items-center px-4 overflow-x-auto no-scrollbar gap-2">
                    {financeTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as ActiveTab)}
                            className={clsx(
                                "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                                    : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <main className={clsx(
                "flex-1 h-screen overflow-auto relative md:pt-0 pb-20 md:pb-0 transition-all",
                isFinanceTab ? "pt-28" : "pt-16" // Adjust padding for Top Nav
            )}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-zinc-50/0 to-zinc-50/0 dark:from-indigo-900/20 dark:via-zinc-900/0 dark:to-zinc-900/0 pointer-events-none transition-colors" />

                <div className="relative p-4 md:p-8 max-w-7xl mx-auto">
                    {children(activeTab)}
                </div>
            </main>

            {/* Mobile Navigation - Hidden on Desktop */}
            <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
    );
}
