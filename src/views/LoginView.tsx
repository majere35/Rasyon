import { useState } from 'react';
import { ChefHat, Mail, Lock, Loader2, ArrowRight, X, FileText, CheckSquare, Square } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { clsx } from 'clsx';
import { APP_VERSION } from '../config';

export function LoginView() {
    const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');

    // Form States
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [kvkkAccepted, setKvkkAccepted] = useState(false);

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showKvkkModal, setShowKvkkModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (view === 'login') {
                console.log("Attempting login...");
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful!");
                setSuccess("Giriş başarılı! Yönlendiriliyorsunuz...");

                // Fallback: If App.tsx doesn't catch the state change fast enough or something is stuck
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            else if (view === 'register') {
                // Validation (unchanged)
                if (email !== confirmEmail) throw new Error('E-posta adresleri eşleşmiyor.');
                if (password !== confirmPassword) throw new Error('Şifreler eşleşmiyor.');
                if (!kvkkAccepted) throw new Error('Devam etmek için KVKK ve Yasal Bilgilendirme metnini kabul etmelisiniz.');

                console.log("Attempting registration...");
                await createUserWithEmailAndPassword(auth, email, password);
            }
            else if (view === 'forgot-password') {
                console.log("Sending reset email...");
                await sendPasswordResetEmail(auth, email);
                setSuccess('Şifre sıfırlama bağlantısı gönderildi.');
                setTimeout(() => setView('login'), 3000);
            }
        } catch (err: any) {
            console.error("Auth Error:", err);

            // Firebase Error Codes Handling (Priority)
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('E-posta veya şifre hatalı.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Bu e-posta adresi zaten kullanımda.');
            } else if (err.code === 'auth/weak-password') {
                setError('Şifre en az 6 karakter olmalıdır.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Çok fazla başarısız deneme. Lütfen bir süre sonra tekrar deneyin.');
            } else if (err.message) {
                // Fallback to generic message if it's a manual Error throw (like validation)
                // Filter out 'Firebase: ' prefix if present in message for cleaner UI
                setError(err.message.replace('Firebase: ', ''));
            } else {
                setError('Bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleView = (newView: 'login' | 'register' | 'forgot-password') => {
        setView(newView);
        setError(null);
        setSuccess(null);
        // Retain email if switching between login/forgot/register for convenience, clear others
        setPassword('');
        setConfirmPassword('');
        setConfirmEmail('');
        setKvkkAccepted(false);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f11] flex items-center justify-center p-4 transition-colors relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

            {/* KVKK Modal */}
            {showKvkkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#18181b] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-zinc-200 dark:border-zinc-800">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <FileText className="text-indigo-500" size={20} />
                                KVKK ve Yasal Bilgilendirme
                            </h3>
                            <button onClick={() => setShowKvkkModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-sm text-zinc-600 dark:text-zinc-300 space-y-4">
                            <p><strong>1. Veri Sorumlusu</strong><br />Bu metin, kişisel verilerinizin 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında işlenmesine ilişkin aydınlatma metnidir.</p>
                            <p><strong>2. İşlenen Kişisel Veriler</strong><br />Uygulamayı kullanırken e--posta adresiniz, oluşturduğunuz reçeteler, satış hedefleri ve finansal verileriniz sistemlerimizde saklanmaktadır.</p>
                            <p><strong>3. Verilerin İşlenme Amacı</strong><br />Verileriniz, uygulamanın sunduğu finansal analiz, maliyet hesaplama ve raporlama hizmetlerinin sağlanması amacıyla işlenmektedir.</p>
                            <p><strong>4. Veri Güvenliği</strong><br />Verileriniz Firebase altyapısında şifreli olarak saklanmakta olup, üçüncü taraflarla reklam amaçlı paylaşılmamaktadır.</p>
                            <p><strong>5. Haklarınız</strong><br />Dilediğiniz zaman hesabınızı ve tüm verilerinizi "Ayarlar &gt; Verileri Sıfırla" menüsünden kalıcı olarak silebilirsiniz.</p>
                        </div>
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                            <button
                                onClick={() => {
                                    setKvkkAccepted(true);
                                    setShowKvkkModal(false);
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Okudum, Kabul Ediyorum
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                            <ChefHat size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">RASYON</h1>
                        <p className="text-zinc-500 text-sm">
                            {view === 'login' && 'Hesabınıza giriş yapın'}
                            {view === 'register' && 'Yeni bir hesap oluşturun'}
                            {view === 'forgot-password' && 'Şifrenizi sıfırlayın'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === 'forgot-password' ? (
                            <div className="space-y-4">
                                <p className="text-xs text-zinc-500 text-center px-4">
                                    E-posta adresinizi girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
                                </p>
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
                            </div>
                        ) : (
                            <>
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

                                {view === 'register' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <label className="text-xs font-semibold text-zinc-500 ml-1">E-Posta (Tekrar)</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type="email"
                                                required
                                                className={clsx(
                                                    "w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:ring-1 outline-none transition-all placeholder:text-zinc-500",
                                                    email && confirmEmail && email !== confirmEmail
                                                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                                                        : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                )}
                                                placeholder="ornek@rasyon.app"
                                                value={confirmEmail}
                                                onChange={(e) => setConfirmEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

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

                                {view === 'register' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <label className="text-xs font-semibold text-zinc-500 ml-1">Şifre (Tekrar)</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type="password"
                                                required
                                                className={clsx(
                                                    "w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:ring-1 outline-none transition-all placeholder:text-zinc-500",
                                                    password && confirmPassword && password !== confirmPassword
                                                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                                                        : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                )}
                                                placeholder="••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {view === 'login' && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => toggleView('forgot-password')}
                                            className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
                                        >
                                            Şifremi Unuttum
                                        </button>
                                    </div>
                                )}

                                {view === 'register' && (
                                    <div className="flex items-start gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setKvkkAccepted(!kvkkAccepted)}
                                            className={clsx(
                                                "mt-0.5 flex-shrink-0 transition-colors",
                                                kvkkAccepted ? "text-indigo-500" : "text-zinc-300 dark:text-zinc-600 hover:text-zinc-400"
                                            )}
                                        >
                                            {kvkkAccepted ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                        <div className="text-xs text-zinc-500 leading-snug">
                                            <button
                                                type="button"
                                                onClick={() => setShowKvkkModal(true)}
                                                className="text-indigo-500 hover:underline font-medium"
                                            >
                                                KVKK ve Yasal Bilgilendirme
                                            </button> metnini okudum ve kabul ediyorum.
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs text-center font-medium animate-in fade-in slide-in-from-top-1">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 mt-6",
                                loading && "opacity-70 cursor-wait"
                            )}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    {view === 'login' && 'Giriş Yap'}
                                    {view === 'register' && 'Hesap Oluştur'}
                                    {view === 'forgot-password' && 'Bağlantı Gönder'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-zinc-100 dark:border-zinc-800 pt-4">
                        {view === 'login' ? (
                            <button
                                onClick={() => toggleView('register')}
                                className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                            >
                                Hesabınız yok mu? <span className="font-bold">Kayıt Olun</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => toggleView('login')}
                                className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                            >
                                Zaten hesabınız var mı? <span className="font-bold">Giriş Yapın</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 text-center border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400">2025 RASYON {APP_VERSION}</p>
                </div>
            </div>
        </div>
    );
}
