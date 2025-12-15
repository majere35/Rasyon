import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';

export function TaxSummary({ profit, revenue, expensesVat }: { profit: number, revenue: number, expensesVat: number }) {
    const { company } = useStore();

    // 2025 Turkish Tax Brackets for Sole Proprietorship (Şahıs)
    const calculateIncomeTax = (annualProfit: number) => {
        if (!company || company.type === 'limited') {
            // Corporate Tax (Kurumlar Vergisi) - 25% on Profit
            return Math.max(0, annualProfit) * 0.25;
        }

        // Progressive Tax for Şahıs
        let tax = 0;
        const income = annualProfit; // Annual Profit

        if (income <= 158000) {
            tax = income * 0.15;
        } else if (income <= 330000) {
            tax = 23700 + (income - 158000) * 0.20;
        } else if (income <= 800000) {
            tax = 58100 + (income - 330000) * 0.27;
        } else if (income <= 4300000) {
            tax = 185000 + (income - 800000) * 0.35;
        } else {
            tax = 1410000 + (income - 4300000) * 0.40;
        }
        return tax;
    };

    const monthlyProfit = profit;
    const annualProfit = profit * 12;
    const annualTax = calculateIncomeTax(annualProfit);
    const monthlyTax = annualTax / 12;

    // VAT (KDV)
    const incomeVat = revenue * 0.10; // 10% on Revenue
    // expenseVat is passed in (calculated row by row)
    const vatDiff = incomeVat - expensesVat;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-5">
            {/* Income Tax Section */}
            <div>
                <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
                    {company?.type === 'limited' ? 'KURUMLAR VERGİSİ (%25)' : 'GELİR VERGİSİ HESAPLAMA'}
                </h3>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Aylık Kâr</span>
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
                        <span className="text-green-400 font-mono">-{formatCurrency(expensesVat)}</span>
                    </div>
                    <div className="w-full h-px bg-zinc-800/50 my-1"></div>
                    <div className="flex justify-between items-end">
                        <span className="text-zinc-300 font-medium">Ödenecek KDV Farkı</span>
                        <div className={`font-mono font-bold ${vatDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {vatDiff > 0 ? '-' : '+'}{formatCurrency(Math.abs(vatDiff))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
