import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { calculateIncomeTax, calculateVatStatus } from '../utils/taxUtils';
import { appConfig } from '../config/appConfig';

interface TaxSummaryProps {
    profit: number;
    revenue: number;
    expensesVat: number;
    carryInVat?: number;
    stopaj?: number;
    title?: string;
    totalNetExpenses?: number;
}

export function TaxSummary({ profit, revenue, expensesVat, carryInVat = 0, stopaj = 0, title, totalNetExpenses }: TaxSummaryProps) {
    const { company } = useStore();

    const monthlyProfit = profit;
    const annualProfit = profit * 12;
    const annualTax = calculateIncomeTax(annualProfit, company?.type || 'sahis');
    const monthlyTax = annualTax / 12;

    // VAT (KDV)
    const incomeVat = revenue * (appConfig.revenueVat.rate / 100);
    const { payableVat, carryOverToNext } = calculateVatStatus(incomeVat, expensesVat, carryInVat);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-5">
            {/* Income Tax Section */}
            <div>
                <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
                    {title || (company?.type === 'limited' ? 'KURUMLAR VERGİSİ (%25)' : 'GELİR VERGİSİ HESAPLAMA')}
                </h3>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Aylık Kâr (Tahmini)</span>
                        <span className="text-white font-mono">{formatCurrency(monthlyProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Yıllık Tahmini Kâr</span>
                        <span className="text-white font-mono">{formatCurrency(annualProfit)}</span>
                    </div>
                    <div className="w-full h-px bg-zinc-800/50 my-1"></div>
                    <div className="flex justify-between text-yellow-500">
                        <span>Yıllık Vergi</span>
                        <span className="font-mono">{formatCurrency(annualTax)}</span>
                    </div>
                    <div className="flex justify-between text-red-400 font-bold">
                        <span>Aylık Ort. Vergi</span>
                        <span className="font-mono">-{formatCurrency(monthlyTax)}</span>
                    </div>
                    {stopaj > 0 && (
                        <div className="flex justify-between text-orange-400 font-bold">
                            <span>Ödenecek Stopaj</span>
                            <span className="font-mono">-{formatCurrency(stopaj)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* VAT Section */}
            <div>
                <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
                    KDV HESAPLAMA (AYLIK)
                </h3>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Hesaplanan KDV (Gelir %10)</span>
                        <span className="text-white font-mono">{formatCurrency(incomeVat)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">İndirilecek KDV (Giderler)</span>
                        <span className="text-white font-mono">-{formatCurrency(expensesVat)}</span>
                    </div>
                    {carryInVat > 0 && (
                        <div className="flex justify-between text-indigo-400 font-medium">
                            <span>Önceki Aydan Devreden KDV</span>
                            <span className="font-mono">-{formatCurrency(carryInVat)}</span>
                        </div>
                    )}
                    <div className="w-full h-px bg-zinc-800/50 my-1"></div>

                    {totalNetExpenses !== undefined && (
                        <div className="flex justify-between items-center mb-1 text-orange-400 font-bold">
                            <span>KDV Dahil Toplam Gider</span>
                            <span className="font-mono text-sm underline decoration-white/20 underline-offset-4">
                                {formatCurrency(totalNetExpenses + expensesVat)}
                            </span>
                        </div>
                    )}

                    {payableVat > 0 ? (
                        <div className="flex justify-between items-end">
                            <span className="text-zinc-300 font-medium">Ödenecek KDV</span>
                            <div className="font-mono font-bold text-red-400">
                                -{formatCurrency(payableVat)}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-end">
                            <span className="text-indigo-400 font-medium">Sonraki Aya Devreden KDV</span>
                            <div className="font-mono font-bold text-green-400">
                                +{formatCurrency(carryOverToNext)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
