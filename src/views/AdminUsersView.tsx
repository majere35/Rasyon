import { useState, useEffect } from 'react';
import { Search, User, Mail, Calendar, Activity, MoreVertical, Shield } from 'lucide-react';
import { subscribeToUsers, getAllUsers } from '../lib/db';

export function AdminUsersView() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Initial Subscription
    useEffect(() => {
        let mounted = true;

        // Timeout check: If data takes too long (e.g. 8s), show error
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                setLoading(false);
                setError("Bağlantı zaman aşımına uğradı. (Listener Timeout)");
            }
        }, 8000);

        const unsubscribe = subscribeToUsers((data) => {
            if (mounted) {
                setUsers(data);
                setLoading(false);
                setError(null);
                clearTimeout(timeoutId);
            }
        }, (err) => {
            if (mounted) {
                console.error("View received error:", err);
                setError("Kullanıcı verilerine erişilemiyor. (Permission/Network Error)");
                setLoading(false);
                clearTimeout(timeoutId);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    const handleManualRetry = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers();
            setUsers(data);
            setLoading(false);
        } catch (err: any) {
            console.error("Manual fetch error:", err);
            setLoading(false);
            setError(`Veri çekme hatası: ${err.message || 'Bilinmeyen hata'}`);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <User className="text-indigo-500" /> Kullanıcı Yönetimi
                    </h2>
                    <p className="text-zinc-500 text-sm">Sistemdeki tüm kayıtlı kullanıcılar ve durumları</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Kullanıcı ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 text-sm text-zinc-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Kullanıcı</th>
                                <th className="px-6 py-4">Bakiye/Tarife</th>
                                <th className="px-6 py-4">Kayıt Tarihi</th>
                                <th className="px-6 py-4">Son Aktivite</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>Yükleniyor...</span>
                                            <span className="text-xs text-zinc-400">Veritabanı bağlantısı bekleniyor (Users)</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="text-red-500 font-medium">{error}</div>
                                            <button
                                                onClick={handleManualRetry}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors flex items-center gap-2"
                                            >
                                                Tekrar Dene (Manuel)
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        Kullanıcı bulunamadı. (Toplam: {users.length})
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                                                    {user.displayName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                                                        {user.displayName || 'İsimsiz Kullanıcı'}
                                                        {user.email === '4bros.tr@gmail.com' && (
                                                            <span className="p-0.5 rounded bg-blue-500/10 text-blue-500" title="Admin">
                                                                <Shield size={12} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">{user.email}</div>
                                                    {user.company && (
                                                        <div className="text-[10px] text-zinc-400 mt-0.5">{user.company.officialName}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-zinc-600 dark:text-zinc-400">-</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Calendar size={14} />
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Activity size={14} />
                                                {user.lastActive ? new Date(user.lastActive).toLocaleString('tr-TR') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
