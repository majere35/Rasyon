import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';

interface DashboardLayoutProps {
    children: (activeTab: 'recipes' | 'targets' | 'balance') => React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState<'recipes' | 'targets' | 'balance'>('recipes');

    return (
        <div className="flex min-h-screen bg-[#0f0f11] text-zinc-100 font-sans selection:bg-indigo-500/30">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="flex-1 h-screen overflow-auto relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

                <div className="relative p-8 max-w-7xl mx-auto">
                    {children(activeTab)}
                </div>
            </main>
        </div>
    );
}
