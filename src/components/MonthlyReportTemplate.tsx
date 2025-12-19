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
        <div id="monthly-report-template" className="bg-white text-black p-[20mm] w-[210mm] min-h-[297mm] mx-auto shadow-2xl relative" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">RASYON</h1>
                    <p className="text-sm text-gray-500">Aylık Finansal Rapor</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase">{data.monthStr} DÖNEMİ</h2>
                    <p className="text-xs text-gray-400">Oluşturulma Tarihi: {today}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Toplam Ciro</p>
                    <p className="text-2xl font-mono font-bold text-black">{formatCurrency(aggregatedData.totalRevenue)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Net Kâr (Vergi Öncesi)</p>
                    <p className={`text-2xl font-mono font-bold ${netProfit >= 0 ? 'text-black' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                    </p>
                </div>
                <div className="bg-gray-900 text-white p-4 rounded border border-black">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Net Kâr (Vergi Sonrası)</p>
                    <p className="text-2xl font-mono font-bold">{formatCurrency(netProfitAfterTax)}</p>
                </div>
            </div>

            {/* Expense Breakdown Table */}
            <div className="mb-8">
                <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase">Gider Dağılımı</h3>
                <div className="space-y-6">
                    {aggregatedData.groups.map((group: any) => {
                        const groupTotal = group.items.reduce((sum: number, item: any) => sum + item.amount, 0);
                        if (groupTotal === 0) return null;

                        return (
                            <div key={group.id} className="break-inside-avoid">
                                <div className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded mb-2">
                                    <h4 className="font-bold text-sm uppercase">{group.title}</h4>
                                    <span className="font-mono font-bold text-sm">{formatCurrency(groupTotal)}</span>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {group.items.map((item: any, idx: number) => {
                                            if (item.amount === 0) return null;
                                            return (
                                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-1.5 px-3 text-gray-700">{item.name}</td>
                                                    <td className="py-1.5 px-3 text-right font-mono">{formatCurrency(item.amount)}</td>
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
            <div className="mt-auto break-inside-avoid">
                <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase">Vergi Özeti</h3>
                <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-2 px-4 text-left font-bold text-gray-600">Vergi Kalemi</th>
                            <th className="py-2 px-4 text-right font-bold text-gray-600">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td className="py-2 px-4">Ödenecek KDV</td>
                            <td className="py-2 px-4 text-right font-mono">
                                {formatCurrency(Math.max(0, (aggregatedData.totalRevenue * 0.10) - aggregatedData.totalDeductibleVat))}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4">Stopaj Vergisi</td>
                            <td className="py-2 px-4 text-right font-mono">{formatCurrency(aggregatedData.totalStopajTax)}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4">Tahmini Gelir Vergisi (Aylık)</td>
                            <td className="py-2 px-4 text-right font-mono">
                                {formatCurrency(totalTaxPayable - Math.max(0, (aggregatedData.totalRevenue * 0.10) - aggregatedData.totalDeductibleVat) - aggregatedData.totalStopajTax)}
                            </td>
                        </tr>
                        <tr className="bg-gray-50 font-bold">
                            <td className="py-2 px-4">TOPLAM ÖDENECEK VERGİ</td>
                            <td className="py-2 px-4 text-right font-mono text-red-600">{formatCurrency(totalTaxPayable)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] text-center border-t border-gray-200 pt-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Rasyon Finansal Yönetim Sistemi Tarafından Oluşturulmuştur</p>
            </div>
        </div>
    );
}
