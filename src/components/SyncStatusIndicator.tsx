import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncStatusIndicatorProps {
    status: SyncStatus;
    onManualSync?: () => void;
    lastSyncTime?: Date | null;
}

export function SyncStatusIndicator({ status, onManualSync, lastSyncTime }: SyncStatusIndicatorProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const getStatusConfig = () => {
        switch (status) {
            case 'syncing':
                return {
                    icon: <RefreshCw size={14} className="animate-spin" />,
                    color: 'text-indigo-400',
                    bgColor: 'bg-indigo-500/10',
                    label: 'Senkronize ediliyor...'
                };
            case 'synced':
                return {
                    icon: <Check size={14} />,
                    color: 'text-green-400',
                    bgColor: 'bg-green-500/10',
                    label: 'Senkronize'
                };
            case 'error':
                return {
                    icon: <AlertCircle size={14} />,
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/10',
                    label: 'Senkronizasyon hatası'
                };
            case 'offline':
                return {
                    icon: <CloudOff size={14} />,
                    color: 'text-zinc-500',
                    bgColor: 'bg-zinc-500/10',
                    label: 'Çevrimdışı'
                };
            default:
                return {
                    icon: <Cloud size={14} />,
                    color: 'text-zinc-400',
                    bgColor: 'bg-zinc-500/10',
                    label: 'Bekleniyor'
                };
        }
    };

    const config = getStatusConfig();

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative">
            <button
                onClick={onManualSync}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                disabled={status === 'syncing'}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bgColor} ${config.color} transition-all hover:opacity-80 disabled:cursor-not-allowed`}
            >
                {config.icon}
                <span className="text-xs font-medium hidden sm:inline">{config.label}</span>
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-xs text-zinc-400 space-y-1">
                        <div className="flex justify-between">
                            <span>Durum:</span>
                            <span className={config.color}>{config.label}</span>
                        </div>
                        {lastSyncTime && (
                            <div className="flex justify-between">
                                <span>Son sync:</span>
                                <span className="text-zinc-300">{formatTime(lastSyncTime)}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-zinc-800 mt-2">
                            <span className="text-zinc-500 text-[10px]">
                                Tıklayarak manuel senkronize edebilirsiniz
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Hook for managing sync state
export function useSyncStatus() {
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [pendingChanges, setPendingChanges] = useState(false);

    // Check online status
    useEffect(() => {
        const handleOnline = () => {
            if (status === 'offline') setStatus('idle');
        };
        const handleOffline = () => setStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (!navigator.onLine) setStatus('offline');

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [status]);

    const startSync = useCallback(() => {
        if (status !== 'offline') {
            setStatus('syncing');
        }
    }, [status]);

    const syncSuccess = useCallback(() => {
        setStatus('synced');
        setLastSyncTime(new Date());
        setPendingChanges(false);

        // Reset to idle after 3 seconds
        setTimeout(() => {
            setStatus(prev => prev === 'synced' ? 'idle' : prev);
        }, 3000);
    }, []);

    const syncError = useCallback(() => {
        setStatus('error');
    }, []);

    const markPendingChanges = useCallback(() => {
        setPendingChanges(true);
    }, []);

    return {
        status,
        lastSyncTime,
        pendingChanges,
        startSync,
        syncSuccess,
        syncError,
        markPendingChanges,
        setStatus
    };
}
