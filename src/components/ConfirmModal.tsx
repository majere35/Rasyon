import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-500'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
                    </div>
                    <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white transition-colors font-medium"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${type === 'danger'
                            ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500'
                            : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                            }`}
                    >
                        Onayla
                    </button>
                </div>
            </div>
        </div>
    );
}
