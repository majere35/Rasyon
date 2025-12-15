import { useState, useEffect } from 'react';
import { Users, Activity, Database, TrendingUp, RefreshCw, Clock, Shield } from 'lucide-react';
import { subscribeToSystemStats, subscribeToUsers } from '../lib/db';

export function AdminView() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSessionCount: 0,
        totalDataSize: '0 KB',
        recipesCount: 0,
        expensesCount: 0
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    const handleRefresh = () => {
        // Since we are using subscriptions, this might just be a placebo or could trigger a re-mount if we wanted,
        // but for now let's just show a toast or log.
        console.log("Refreshing data...");
    };

    useEffect(() => {
        const unsubStats = subscribeToSystemStats((data) => {
            setStats(data);
        });

        const unsubUsers = subscribeToUsers((data) => {
            // Take top 5 recent
            setRecentUsers(data.slice(0, 5));
        });

        return () => {
            unsubStats();
            unsubUsers();
        };
    }, []);

    const statCards = [
        { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Aktif Oturum (24s)', value: stats.activeSessionCount, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Veri Boyutu', value: stats.totalDataSize, icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Toplam Reçete', value: stats.recipesCount, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-amber-500" /> Admin Dashboard
                    </h2>
                    <p className="text-zinc-500 text-sm">Sistem durumu ve canlı istatistikler</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-400"
                    title="Yenile"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`${stat.bg} p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs text-zinc-500 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500" /> Son Aktiviteler
                        </h3>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {recentUsers.length === 0 ? (
                            <div className="p-6 text-center text-zinc-500 text-sm">Henüz aktivite yok.</div>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                                            {user.displayName?.substring(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-zinc-900 dark:text-white">
                                                {user.displayName || user.email}
                                            </div>
                                            <div className="text-[10px] text-zinc-500">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {user.lastActive ? new Date(user.lastActive).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions (Placeholder) */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield size={120} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Hızlı İşlemler</h3>
                    <p className="text-indigo-100 text-sm mb-6 max-w-[80%]">
                        Sistem kontrollerini buradan gerçekleştirebilirsiniz. Veritabanı bakımı ve yedekleme işlemleri otomatik yapılmaktadır.
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors border border-white/20">
                            Sistem Raporu
                        </button>
                        <button className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors shadow-lg">
                            Kullanıcı Ekle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
