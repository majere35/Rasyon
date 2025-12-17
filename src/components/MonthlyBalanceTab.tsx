
import { useMemo } from 'react';
import { Building2, Factory, Truck, Users, TrendingUp, Banknote } from 'lucide-react';
import type { MonthlyMonthData } from '../types';

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

        // 2. Initialize Sums for ALL 15 Categories
        const sums = {
            // General
            rent: 0,
            bills: 0,     // Faturalar
            accounting: 0,
            pos: 0,
            security: 0,  // İlaçlama ve Güvenlik

            // Production
            food: 0,
            packaging: 0,
            waste: 0,     // Fire/Zayii
            maintenance: 0,

            // Sales (Commissions is auto)
            marketing: 0, // Reklam
            courier: 0,   // Kurye

            // Personnel
            salary: 0,    // Net Maaş
            sgk: 0,
            benefits: 0,  // Yol, Yemek ve Yan Haklar

            other: 0,      // Unmatched
        };

        // 3. Map Invoices via Keywords
        invoices.forEach(inv => {
            const cat = (inv.category || '').toLowerCase();
            const desc = (inv.description || '').toLowerCase();
            const supplier = (inv.supplier || '').toLowerCase();
            const text = `${cat} ${desc} ${supplier}`; // Search in all fields
            const amt = inv.amount || 0;

            // Priority Matching
            if (text.includes('kira') || text.includes('stopaj')) {
                sums.rent += amt;
            } else if (text.includes('enerji') || text.includes('elektrik') || text.includes('su ') || text.includes('su faturası') || text.includes('internet') || text.includes('doğalgaz') || text.includes('fatura')) {
                sums.bills += amt;
            } else if (text.includes('muhasebe') || text.includes('müşavir') || text.includes('mali')) {
                sums.accounting += amt;
            } else if (text.includes('pos') || text.includes('yazılım') || text.includes('adisyon') || text.includes('program')) {
                sums.pos += amt;
            } else if (text.includes('ilaç') || text.includes('güvenlik') || text.includes('alarm')) {
                sums.security += amt;
            } else if (text.includes('gıda') || text.includes('hammadde') || text.includes('kasap') || text.includes('manav') || text.includes('market') || text.includes('toptan')) {
                sums.food += amt;
            } else if (text.includes('ambalaj') || text.includes('kutu') || text.includes('paket') || text.includes('poşet')) {
                sums.packaging += amt;
            } else if (text.includes('fire') || text.includes('zayi')) {
                sums.waste += amt;
            } else if (text.includes('bakım') || text.includes('onarım') || text.includes('tamir') || text.includes('servis')) {
                sums.maintenance += amt;
            } else if (text.includes('reklam') || text.includes('sosyal') || text.includes('tanıtım') || text.includes('medya') || text.includes('ads')) {
                sums.marketing += amt;
            } else if (text.includes('kurye') || text.includes('lojistik') || text.includes('dağıtım')) {
                sums.courier += amt;
            } else if (text.includes('maaş') || text.includes('huzur') || text.includes('avans')) {
                sums.salary += amt;
            } else if (text.includes('sgk') || text.includes('bağkur') || text.includes('sigorta')) {
                sums.sgk += amt;
            } else if (text.includes('yol') || text.includes('yemek') || text.includes('ticket') || text.includes('sodexo') || text.includes('multinet') || text.includes('yan hak')) {
                sums.benefits += amt;
            } else {
                sums.other += amt;
            }
        });

        // 4. Totals
        const totalRevenue = dailySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

        // Prepare Group Data for UI (Matching Project Wizard Standard)
        return {
            totalRevenue,
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
                                    // Logic: Show row if amount > 0 OR if it's "isAuto" (like commissions) OR if we want to show all standard items even if empty (for completeness). 
                                    // User asked for "all expense items... exactly the same". So likely wants to see them even if 0, or at least the standard ones. 
                                    // But showing many 0s might be cluttered. Let's show if >0 OR matching a standard ID. 
                                    // For now, I'll show all of them to be "exactly the same" as requested structure.

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
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <TrendingUp className="text-green-500" />
                        Finansal Özet ({data.monthStr})
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-baseline pb-4 border-b border-zinc-800">
                            <span className="text-zinc-400">Toplam Ciro</span>
                            <span className="text-green-400 font-bold font-mono text-2xl">{formatCurrency(aggregatedData.totalRevenue)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">Toplam Giderler</span>
                            <span className="text-red-400 font-mono font-medium">-{formatCurrency(totalExpenses)}</span>
                        </div>

                        <div className="pt-4 mt-2 border-t border-zinc-800">
                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-sm font-bold text-zinc-400">Net Kâr (Tahmini)</span>
                                <div className={`text-3xl font-bold font-mono ${netProfit >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>
                                    {formatCurrency(netProfit)}
                                </div>
                                <span className="text-[10px] text-zinc-500">Vergi öncesi tahmini net kâr</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Banknote size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Bilanço Hakkında</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                                Bu tablo, Projeksiyon Sihirbazı standartlarına göre oluşturulmuştur. Girdiğiniz faturalar akıllı anahtar kelimelerle otomatik olarak sınıflandırılır.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
