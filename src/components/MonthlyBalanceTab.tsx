import { useMemo } from 'react';
import { Building2, Factory, Truck, Users, TrendingUp } from 'lucide-react';
import type { MonthlyMonthData } from '../types';
import { useStore } from '../store/useStore';
import { TaxSummary } from './TaxSummary';

// Basic formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

interface MonthlyBalanceTabProps {
    data: MonthlyMonthData;
}

export function MonthlyBalanceTab({ data }: MonthlyBalanceTabProps) {

    // --- AGGREGATION LOGIC ---
    const aggregatedData = useMemo(() => {
        const invoices = data.invoices || [];
        const dailySales = data.dailySales || [];

        // 1. Calculate Online Commissions (10%)
        const totalOnlineSales = dailySales.reduce((sum, sale) => {
            return sum + (sale.yemeksepeti || 0) + (sale.trendyol || 0) + (sale.getirYemek || 0) + (sale.migrosYemek || 0);
        }, 0);
        const commissionCost = totalOnlineSales * 0.10;
        const commissionVat = commissionCost * 0.20; // Assuming 20% VAT on commissions

        // 2. Initialize Sums
        const sums = {
            rent: 0, bills: 0, accounting: 0, pos: 0, security: 0,
            food: 0, packaging: 0, waste: 0, maintenance: 0,
            marketing: 0, courier: 0,
            salary: 0, sgk: 0, benefits: 0,
            taxes: 0, // New bucket for Taxes/Stamp Duty
            other: 0,

            // Tax Accumulators
            totalDeductibleVat: 0,
            totalStopajTax: 0
        };

        // Add Commission VAT
        sums.totalDeductibleVat += commissionVat;

        // 3. Map Invoices by Category (Direct Matching - No Keywords)
        invoices.forEach(inv => {
            const category = inv.category || 'diger';
            const amt = inv.amount || 0;

            // TAX CALCULATIONS
            if (category === 'kira') {
                if (inv.taxMethod === 'stopaj') {
                    const gross = amt / 0.8;
                    const stopaj = gross * 0.20;
                    sums.totalStopajTax += stopaj;
                } else {
                    const vat = amt * ((inv.taxRate || 20) / 100);
                    sums.totalDeductibleVat += vat;
                }
            } else {
                const vat = amt * ((inv.taxRate !== undefined ? inv.taxRate : 20) / 100);
                sums.totalDeductibleVat += vat;
            }

            // CATEGORY MAPPING (Direct by category value)
            switch (category) {
                // GENEL YÖNETİM
                case 'kira':
                    sums.rent += amt;
                    break;
                case 'faturalar':
                    sums.bills += amt;
                    break;
                case 'muhasebe':
                    sums.accounting += amt;
                    break;
                case 'vergi':
                    sums.taxes += amt;
                    break;
                case 'pos':
                    sums.pos += amt;
                    break;
                case 'guvenlik':
                    sums.security += amt;
                    break;

                // ÜRETİM GİDERLERİ
                case 'gida':
                    sums.food += amt;
                    break;
                case 'ambalaj':
                    sums.packaging += amt;
                    break;
                case 'fire':
                    sums.waste += amt;
                    break;
                case 'bakim':
                    sums.maintenance += amt;
                    break;

                // SATIŞ & DAĞITIM
                case 'reklam':
                    sums.marketing += amt;
                    break;
                case 'kurye':
                    sums.courier += amt;
                    break;

                // PERSONEL
                case 'maas':
                    sums.salary += amt;
                    break;
                case 'sgk':
                    sums.sgk += amt;
                    break;
                case 'yan_haklar':
                    sums.benefits += amt;
                    break;

                // DİĞER (veya tanınmayan kategoriler)
                case 'diger':
                default:
                    sums.other += amt;
                    break;
            }
        });

        // 4. Totals
        const totalRevenue = dailySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

        return {
            totalRevenue,
            totalStopajTax: sums.totalStopajTax,
            totalDeductibleVat: sums.totalDeductibleVat,
            groups: [
                {
                    id: 'general',
                    title: 'GENEL YÖNETİM',
                    icon: Building2,
                    color: 'text-blue-400',
                    items: [
                        { name: 'Kira', amount: sums.rent },
                        { name: 'Faturalar (Elektrik/Su/İnternet)', amount: sums.bills },
                        { name: 'Muhasebe', amount: sums.accounting },
                        { name: 'Vergi ve Harçlar (Damga vb.)', amount: sums.taxes },
                        { name: 'Pos Yazılım', amount: sums.pos },
                        { name: 'İlaçlama ve Güvenlik', amount: sums.security },
                        ...(sums.other > 0 ? [{ name: 'Diğer / Sınıflandırılmamış', amount: sums.other }] : [])
                    ]
                },
                {
                    id: 'production',
                    title: 'ÜRETİM GİDERLERİ',
                    icon: Factory,
                    color: 'text-orange-400',
                    items: [
                        { name: 'Gıda Hammadde', amount: sums.food },
                        { name: 'Ambalaj', amount: sums.packaging },
                        { name: 'Fire/Zayii', amount: sums.waste },
                        { name: 'Bakım/Onarım', amount: sums.maintenance }
                    ]
                },
                {
                    id: 'sales',
                    title: 'SATIŞ & DAĞITIM',
                    icon: Truck,
                    color: 'text-purple-400',
                    items: [
                        { name: 'Online Satış Komisyonları', amount: commissionCost, isAuto: true, note: '%10' },
                        { name: 'Reklam Giderleri', amount: sums.marketing },
                        { name: 'Kurye Masrafı', amount: sums.courier }
                    ]
                },
                {
                    id: 'personnel',
                    title: 'PERSONEL',
                    icon: Users,
                    color: 'text-green-400',
                    items: [
                        { name: 'Net Maaş', amount: sums.salary },
                        { name: 'SGK', amount: sums.sgk },
                        { name: 'Yol, Yemek ve Yan Haklar', amount: sums.benefits }
                    ]
                }
            ]
        };
    }, [data]);

    const totalExpenses = aggregatedData.groups.reduce((sum, group) => {
        return sum + group.items.reduce((gSum, item) => gSum + item.amount, 0);
    }, 0);

    const netProfit = aggregatedData.totalRevenue - totalExpenses;

    const { company } = useStore();

    // Tax Calculation Logic (Copied/Adapted from TaxSummary for unified view)
    const calculateIncomeTax = (annualProfit: number) => {
        // Zarar varsa gelir vergisi yok
        if (annualProfit <= 0) return 0;

        if (!company || company.type === 'limited') {
            return Math.max(0, annualProfit) * 0.25;
        }
        let tax = 0;
        const income = annualProfit;
        if (income <= 158000) tax = income * 0.15;
        else if (income <= 330000) tax = 23700 + (income - 158000) * 0.20;
        else if (income <= 800000) tax = 58100 + (income - 330000) * 0.27;
        else if (income <= 4300000) tax = 185000 + (income - 800000) * 0.35;
        else tax = 1410000 + (income - 4300000) * 0.40;
        return tax;
    };

    // Calculate Taxes
    const incomeVat = aggregatedData.totalRevenue * 0.10; // 10% Revenue VAT
    const vatDiff = incomeVat - aggregatedData.totalDeductibleVat;
    const payableVat = Math.max(0, vatDiff);

    // Income Tax
    const annualProfit = netProfit * 12;
    const annualTax = calculateIncomeTax(annualProfit);
    const monthlyTax = annualTax / 12;

    // Stopaj ayrı bir vergi ödemesi olarak eklenir (kira net olarak gösterildiği için)
    const totalTaxPayable = monthlyTax + payableVat + aggregatedData.totalStopajTax;
    const netProfitAfterTax = netProfit - totalTaxPayable;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* LEFT: Expenses (8 Cols) */}
            <div className="xl:col-span-8 space-y-6">
                {aggregatedData.groups.map((group) => {
                    const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
                    const groupRevenueShare = aggregatedData.totalRevenue > 0 ? (groupTotal / aggregatedData.totalRevenue) * 100 : 0;

                    return (
                        <div key={group.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden`}>
                            {/* Group Header */}
                            <div className={`px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900`}>
                                <h3 className={`font-bold text-zinc-700 dark:text-zinc-200 text-sm flex items-center gap-2`}>
                                    <group.icon size={18} className={group.color} />
                                    {group.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                                        %{groupRevenueShare.toFixed(1)} Ciro
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400 text-sm font-bold">
                                        -{formatCurrency(groupTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-2">
                                {group.items.map((item, idx) => {
                                    const itemShare = aggregatedData.totalRevenue > 0 ? (item.amount / aggregatedData.totalRevenue) * 100 : 0;
                                    const isEmpty = item.amount === 0;

                                    return (
                                        <div key={idx} className={`flex items-center justify-between text-sm py-2 px-3 border-b last:border-0 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isEmpty ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.name}</span>
                                                {item.isAuto && (
                                                    <span className="text-[10px] text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                                        OTOMATİK
                                                    </span>
                                                )}
                                                {item.note && (
                                                    <span className="text-[10px] text-zinc-400">
                                                        ({item.note})
                                                    </span>
                                                )}
                                                {!isEmpty && (
                                                    <span className="text-zinc-400 text-xs ml-2">
                                                        (%{itemShare.toFixed(1)})
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`font-mono font-medium ${isEmpty ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                {isEmpty ? '-' : `-${formatCurrency(item.amount)}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* RIGHT: Financial Summary (4 Cols) */}
            <div className="xl:col-span-4 space-y-6">

                {/* Tax Summary Module */}
                <TaxSummary
                    profit={netProfit}
                    revenue={aggregatedData.totalRevenue}
                    expensesVat={aggregatedData.totalDeductibleVat}
                    stopaj={aggregatedData.totalStopajTax}
                />

                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                        <TrendingUp className="text-green-500" />
                        Finansal Özet ({data.monthStr})
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-baseline pb-2">
                            <span className="text-zinc-400">Tahmini Aylık Ciro</span>
                            <span className="text-green-400 font-bold font-mono text-2xl">{formatCurrency(aggregatedData.totalRevenue)}</span>
                        </div>

                        {/* Expense Breakdown */}
                        <div className="space-y-1 py-3 border-t border-zinc-800/50">
                            {aggregatedData.groups.map(group => {
                                const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
                                const percentage = aggregatedData.totalRevenue > 0 ? (groupTotal / aggregatedData.totalRevenue) * 100 : 0;

                                return (
                                    <div key={group.id} className="flex justify-between text-sm">
                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                            <group.icon size={12} className={group.color} />
                                            <span>
                                                {group.title}
                                                <span className="text-zinc-600 text-xs ml-1">
                                                    (%{percentage.toFixed(1)})
                                                </span>
                                            </span>
                                        </div>
                                        <span className="text-zinc-300 font-mono">-{formatCurrency(groupTotal)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 mt-2 border-t border-zinc-800">
                            {/* Net Profit Pre-Tax */}
                            <div className="flex justify-between mb-2">
                                <span className="text-zinc-500">Net Kâr (Vergi Öncesi)</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${netProfit >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        %{aggregatedData.totalRevenue > 0 ? ((netProfit / aggregatedData.totalRevenue) * 100).toFixed(1) : '0.0'}
                                    </span>
                                    <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>

                            {/* Taxes */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-red-400 font-bold border-t border-zinc-800/50 pt-1 mt-1">
                                    <span>Ödenecek Toplam Vergi</span>
                                    <span className="font-mono">-{formatCurrency(totalTaxPayable)}</span>
                                </div>
                            </div>

                            {/* Net Profit After Tax */}
                            <div className="mt-6 flex flex-col items-end">
                                <span className="text-sm font-bold text-zinc-400">Vergi Sonrası Net Kâr</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${netProfitAfterTax >= 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
                                        %{aggregatedData.totalRevenue > 0 ? ((netProfitAfterTax / aggregatedData.totalRevenue) * 100).toFixed(1) : '0.0'}
                                    </span>
                                    <div className={`text-3xl font-bold font-mono ${netProfitAfterTax >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>
                                        {formatCurrency(netProfitAfterTax)}
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-500">Vergiler ve KDV ödendikten sonra kalan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
