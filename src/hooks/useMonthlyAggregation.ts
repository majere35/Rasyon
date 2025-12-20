import { useMemo } from 'react';
import { Building2, Factory, Truck, Users } from 'lucide-react';
import type { MonthlyMonthData } from '../types';
import { useStore } from '../store/useStore';

// Basic formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

export function useMonthlyAggregation(data: MonthlyMonthData) {
    const { company } = useStore();

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

        // 3. Map Invoices via Keywords
        invoices.forEach(inv => {
            const cat = (inv.category || '').toLowerCase();
            const desc = (inv.description || '').toLowerCase();
            const supplier = (inv.supplier || '').toLowerCase();
            const text = `${cat} ${desc} ${supplier}`;
            const amt = inv.amount || 0;

            // TAX CALCULATIONS (Keep existing logic)
            if (cat.includes('kira') || text.includes('kira')) {
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


            // CATEGORY MAPPING
            // Fix: Only map to Rent if it explicitly says 'kira'. 
            // 'stopaj' keyword alone was causing 'Vergi/Stopaj' category to go to Rent.
            if (text.includes('kira')) {
                if (cat.includes('kira') && inv.taxMethod === 'stopaj') {
                    sums.rent += (amt / 0.8);
                } else {
                    sums.rent += amt;
                }
            } else if (text.includes('enerji') || text.includes('elektrik') || text.includes('su ') || text.includes('su faturası') || text.includes('internet') || text.includes('doğalgaz') || text.includes('fatura')) {
                sums.bills += amt;
            } else if (text.includes('muhasebe') || text.includes('müşavir') || text.includes('mali')) {
                sums.accounting += amt;
            } else if (text.includes('pos') || text.includes('yazılım') || text.includes('adisyon') || text.includes('program')) {
                sums.pos += amt;
            } else if (text.includes('ilaç') || text.includes('güvenlik') || text.includes('alarm')) {
                sums.security += amt;
            } else if (text.includes('vergi') || text.includes('damga') || text.includes('harç') || cat.includes('vergi')) {
                sums.taxes += amt;
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

    // Tax Calculation Logic (Copied/Adapted from TaxSummary for unified view)
    const calculateIncomeTax = (annualProfit: number) => {
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

    const totalTaxPayable = monthlyTax + payableVat + aggregatedData.totalStopajTax;
    const netProfitAfterTax = netProfit - totalTaxPayable;

    return {
        aggregatedData,
        netProfit,
        netProfitAfterTax,
        totalTaxPayable
    };
}
