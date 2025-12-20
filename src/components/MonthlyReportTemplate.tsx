import { formatCurrency } from '../lib/utils';
import type { MonthlyMonthData } from '../types';

interface MonthlyReportTemplateProps {
    data: MonthlyMonthData;
    aggregatedData: any;
    netProfit: number;
    netProfitAfterTax: number;
    totalTaxPayable: number;
}

export function MonthlyReportTemplate({ data, aggregatedData, netProfit, netProfitAfterTax, totalTaxPayable }: MonthlyReportTemplateProps) {
    const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div id="monthly-report-template" className="bg-white text-black p-[10mm] w-[210mm] min-h-[297mm] mx-auto relative flex flex-col" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {/* Header */}
            <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-0">RASYON</h1>
                    <p className="text-xs text-gray-500">Aylık Finansal Rapor</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold uppercase">{data.monthStr} DÖNEMİ</h2>
                    <p className="text-[10px] text-gray-400">Oluşturulma Tarihi: {today}</p>
                </div>
            </div>

            {/* Content Container - Flex Grow to push summary to bottom if needed, or just flow */}
            <div className="flex-1">
                {/* Expense Breakdown Table */}
                <div className="mb-4">
                    <h3 className="text-sm font-bold border-b border-gray-300 pb-1 mb-2">GİDER DAĞILIMI</h3>
                    <div className="space-y-3">
                        {aggregatedData.groups.map((group: any) => {
                            const groupTotal = group.items.reduce((sum: number, item: any) => sum + item.amount, 0);
                            const percentage = aggregatedData.totalRevenue > 0 ? (groupTotal / aggregatedData.totalRevenue) * 100 : 0;

                            if (groupTotal === 0) return null;

                            return (
                                <div key={group.id} className="break-inside-avoid">
                                    <div className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded mb-1">
                                        <h4 className="font-bold text-xs uppercase">
                                            {group.title}
                                            <span className="ml-2 text-gray-500 font-normal">
                                                (%{percentage.toFixed(1)})
                                            </span>
                                        </h4>
                                        <span className="font-mono font-bold text-xs">{formatCurrency(groupTotal)}</span>
                                    </div>
                                    <table className="w-full text-xs">
                                        <tbody>
                                            {group.items.map((item: any, idx: number) => {
                                                if (item.amount === 0) return null;
                                                return (
                                                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                        <td className="py-0.5 px-2 text-gray-700">{item.name}</td>
                                                        <td className="py-0.5 px-2 text-right font-mono">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tax Summary */}
                <div className="break-inside-avoid mb-4">
                    <h3 className="text-sm font-bold border-b border-gray-300 pb-1 mb-2">VERGİ ÖZETİ</h3>
                    <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-1 px-2 text-left font-bold text-gray-600">VERGİ KALEMİ</th>
                                <th className="py-1 px-2 text-right font-bold text-gray-600">TUTAR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="py-1 px-2">Ödenecek KDV</td>
                                <td className="py-1 px-2 text-right font-mono">
                                    {formatCurrency(Math.max(0, (aggregatedData.totalRevenue * 0.10) - aggregatedData.totalDeductibleVat))}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-1 px-2">Stopaj Vergisi</td>
                                <td className="py-1 px-2 text-right font-mono">{formatCurrency(aggregatedData.totalStopajTax)}</td>
                            </tr>
                            <tr>
                                <td className="py-1 px-2">Tahmini Gelir Vergisi (Aylık)</td>
                                <td className="py-1 px-2 text-right font-mono">
                                    {formatCurrency(totalTaxPayable - Math.max(0, (aggregatedData.totalRevenue * 0.10) - aggregatedData.totalDeductibleVat) - aggregatedData.totalStopajTax)}
                                </td>
                            </tr>
                            <tr className="bg-gray-50 font-bold">
                                <td className="py-1 px-2">TOPLAM ÖDENECEK VERGİ</td>
                                <td className="py-1 px-2 text-right font-mono text-red-600">{formatCurrency(totalTaxPayable)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Executive Summary (Moved to Bottom) */}
            <div className="mt-4 mb-8 break-inside-avoid">
                <h3 className="text-sm font-bold border-b border-gray-300 pb-1 mb-2">FİNANSAL ÖZET</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-[10px] text-gray-500 font-bold mb-1">TOPLAM CİRO</p>
                        <p className="text-lg font-mono font-bold text-black">{formatCurrency(aggregatedData.totalRevenue)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-[10px] text-gray-500 font-bold mb-1">NET KÂR (VERGİ ÖNCESİ)</p>
                        <p className={`text-lg font-mono font-bold ${netProfit >= 0 ? 'text-black' : 'text-red-600'}`}>
                            {formatCurrency(netProfit)}
                        </p>
                    </div>
                    <div className="bg-gray-50 text-black p-3 rounded border border-black">
                        <p className="text-[10px] text-gray-500 font-bold mb-1">NET KÂR (VERGİ SONRASI)</p>
                        <p className="text-lg font-mono font-bold">{formatCurrency(netProfitAfterTax)}</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-gray-200 pt-2">
                <p className="text-[8px] text-gray-400 uppercase tracking-widest">Rasyon Finansal Yönetim Sistemi Tarafından Oluşturulmuştur</p>
            </div>
        </div>
    );
}
