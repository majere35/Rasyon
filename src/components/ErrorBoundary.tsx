import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col items-center justify-center font-mono">
                    <div className="max-w-3xl w-full bg-red-950/30 border border-red-800 rounded-xl p-6">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Uygulama Hatası (White Screen Debug)</h1>
                        <p className="mb-4 text-zinc-300">Bir hata oluştuğu için ekran yüklenemedi. Lütfen aşağıdaki hatayı geliştiriciye iletin:</p>

                        <div className="bg-black/50 p-4 rounded-lg overflow-auto mb-4 border border-zinc-800">
                            <p className="text-red-300 font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre className="text-xs text-zinc-500 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack || 'Stack trace yok'}
                            </pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
                        >
                            Sayfayı Yenile
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
