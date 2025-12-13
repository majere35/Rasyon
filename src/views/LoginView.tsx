import { useState } from 'react';
import { ChefHat, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { clsx } from 'clsx';

export function LoginView() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError('E-posta veya şifre hatalı.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Bu e-posta adresi zaten kullanımda.');
            } else if (err.code === 'auth/weak-password') {
                setError('Şifre en az 6 karakter olmalıdır.');
            } else {
                setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f11] flex items-center justify-center p-4 transition-colors">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

            <div className="w-full max-w-md bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                            <ChefHat size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">RASYON</h1>
                        <p className="text-zinc-500 text-sm">
                            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 ml-1">E-Posta</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-500"
                                    placeholder="ornek@rasyon.app"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 ml-1">Şifre</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-500"
                                    placeholder="••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20",
                                loading && "opacity-70 cursor-wait"
                            )}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                        >
                            {isLogin ? "Hesabınız yok mu? Kayıt Olun" : "Zaten hesabınız var mı? Giriş Yapın"}
                        </button>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 text-center border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400">2025 RASYON v1.0.4</p>
                </div>
            </div>
        </div>
    );
}
