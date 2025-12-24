import React from 'react';
import { formatCurrency } from '../lib/utils';
import type { MonthlyMonthData } from '../types';

interface MonthlyReportTemplateProps {
    data: MonthlyMonthData;
    aggregatedData: any;
    netProfit: number;
    netProfitAfterTax: number;
    totalTaxPayable: number;
    carryInVat?: number;
    reportType: 'summary' | 'detailed';
}

export function MonthlyReportTemplate({ data, aggregatedData, netProfit, netProfitAfterTax, totalTaxPayable, carryInVat = 0, reportType }: MonthlyReportTemplateProps) {
    const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Format month string for display (e.g., "2025-12" -> "ARALIK 2025")
    const formatMonthStr = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toLocaleUpperCase('tr-TR');
    };

    // Calculate granular VAT for display
    const incomeVat = aggregatedData.totalRevenue * 0.10;
    const deductibleVat = aggregatedData.totalDeductibleVat;
    const balance = incomeVat - deductibleVat - carryInVat;
    const isCarryOverNext = balance < 0;
    const payableVatAmount = isCarryOverNext ? 0 : balance;

    return (
        <div
            id="monthly-report-template"
            className="bg-white text-black p-[20mm] w-[210mm] min-h-[297mm] mx-auto shadow-2xl relative"
            style={{ fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif" }}
        >
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">RASYON</h1>
                    <p className="text-sm text-gray-600">Aylık Finansal Rapor</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{formatMonthStr(data.monthStr)} DÖNEMİ</h2>
                    <p className="text-xs text-gray-500">Oluşturulma Tarihi: {today}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-50 p-4 rounded border border-gray-300">
                    <p className="text-xs text-gray-600 font-bold mb-1">TOPLAM CİRO</p>
                    <p className="text-2xl font-mono font-bold text-black">{formatCurrency(aggregatedData.totalRevenue)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-300">
                    <p className="text-xs text-gray-600 font-bold mb-1">NET KÂR (VERGİ ÖNCESİ)</p>
                    <p className="text-2xl font-mono font-bold text-black">
                        {formatCurrency(netProfit)}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-300">
                    <p className="text-xs text-gray-600 font-bold mb-1">NET KÂR (VERGİ SONRASI)</p>
                    <p className="text-2xl font-mono font-bold text-black">{formatCurrency(netProfitAfterTax)}</p>
                </div>
            </div>

            {/* Expense Breakdown Table */}
            <div className="mb-8">
                <h3 className="text-lg font-bold border-b border-gray-400 pb-2 mb-4">GİDER DAĞILIMI</h3>
                <div className="space-y-6">
                    {aggregatedData.groups.map((group: any) => {
                        const groupTotal = group.items.reduce((sum: number, item: any) => sum + item.amount, 0);
                        if (groupTotal === 0) return null;

                        return (
                            <div key={group.id} className="break-inside-avoid">
                                <div className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded mb-2 border border-gray-300">
                                    <h4 className="font-bold text-sm">{group.title}</h4>
                                    <span className="font-mono font-bold text-sm">{formatCurrency(groupTotal)}</span>
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {group.items.map((item: any, idx: number) => {
                                            if (item.amount === 0) return null;
                                            return (
                                                <React.Fragment key={idx}>
                                                    <tr className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                                                        <td className="py-2 px-3 text-gray-800 font-medium">{item.name}</td>
                                                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                    {reportType === 'detailed' && item.details && item.details.length > 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-3 pb-3 pt-0">
                                                                <div className="ml-4 pl-3 border-l-2 border-gray-300 bg-gray-50/50 rounded-r text-xs mt-1">
                                                                    <table className="w-full">
                                                                        <tbody>
                                                                            {item.details.map((detail: any, dIdx: number) => (
                                                                                <tr key={dIdx} className="border-b border-gray-100 last:border-0 text-gray-500">
                                                                                    <td className="py-1 pr-2">
                                                                                        <span className="font-semibold text-gray-700">{detail.supplier}</span>
                                                                                        {detail.description && <span className="mx-1 text-gray-400">-</span>}
                                                                                        {detail.description}
                                                                                    </td>
                                                                                    <td className="py-1 text-right font-mono">{formatCurrency(detail.amount)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
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
                <h3 className="text-lg font-bold border-b border-gray-400 pb-2 mb-4">VERGİ ÖZETİ</h3>
                <table className="w-full text-sm border border-gray-300 rounded overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-4 text-left font-bold text-gray-700">Vergi Kalemi</th>
                            <th className="py-2 px-4 text-right font-bold text-gray-700">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td className="py-2 px-4">Hesaplanan KDV (Gelir %10)</td>
                            <td className="py-2 px-4 text-right font-mono">{formatCurrency(incomeVat)}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4">İndirilecek KDV (Giderler)</td>
                            <td className="py-2 px-4 text-right font-mono">-{formatCurrency(deductibleVat)}</td>
                        </tr>
                        {carryInVat > 0 && (
                            <tr>
                                <td className="py-2 px-4">Önceki Aydan Devreden KDV</td>
                                <td className="py-2 px-4 text-right font-mono">-{formatCurrency(carryInVat)}</td>
                            </tr>
                        )}
                        <tr className="bg-gray-50">
                            <td className="py-2 px-4 font-bold">
                                {isCarryOverNext ? 'Sonraki Aya Devreden KDV' : 'Ödenecek KDV Durumu'}
                            </td>
                            <td className={`py-2 px-4 text-right font-mono font-bold ${isCarryOverNext ? 'text-indigo-600' : ''}`}>
                                {isCarryOverNext ? `+${formatCurrency(Math.abs(balance))}` : `-${formatCurrency(payableVatAmount)}`}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4">Stopaj Vergisi</td>
                            <td className="py-2 px-4 text-right font-mono">{formatCurrency(aggregatedData.totalStopajTax)}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4">Tahmini Gelir Vergisi (Aylık)</td>
                            <td className="py-2 px-4 text-right font-mono">
                                {formatCurrency(totalTaxPayable - payableVatAmount - aggregatedData.totalStopajTax)}
                            </td>
                        </tr>
                        <tr className="bg-gray-100 font-bold">
                            <td className="py-2 px-4">TOPLAM ÖDENECEK VERGİ</td>
                            <td className="py-2 px-4 text-right font-mono">{formatCurrency(totalTaxPayable)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] text-center border-t border-gray-300 pt-4">
                <p className="text-[10px] text-gray-500 tracking-widest uppercase">RASYON TARAFINDAN {new Date().toLocaleDateString('tr-TR')} TARİHİNDE OLUŞTURULMUŞTUR</p>
            </div>
        </div>
    );
}
