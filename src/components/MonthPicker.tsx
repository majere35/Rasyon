import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, ChevronDown } from 'lucide-react';
import type { MonthlyMonthData } from '../types';

interface MonthPickerProps {
    selectedMonth: string;
    onChange: (monthStr: string) => void;
    closings: MonthlyMonthData[];
}

export function MonthPicker({ selectedMonth, onChange, closings }: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => parseInt(selectedMonth.split('-')[0]));
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Update view year when selected month changes externally
    useEffect(() => {
        setViewYear(parseInt(selectedMonth.split('-')[0]));
    }, [selectedMonth]);

    const months = [
        { value: 1, label: 'Ocak' },
        { value: 2, label: 'Şubat' },
        { value: 3, label: 'Mart' },
        { value: 4, label: 'Nisan' },
        { value: 5, label: 'Mayıs' },
        { value: 6, label: 'Haziran' },
        { value: 7, label: 'Temmuz' },
        { value: 8, label: 'Ağustos' },
        { value: 9, label: 'Eylül' },
        { value: 10, label: 'Ekim' },
        { value: 11, label: 'Kasım' },
        { value: 12, label: 'Aralık' },
    ];

    const handleMonthSelect = (monthIndex: number) => {
        const monthStr = `${viewYear}-${String(monthIndex).padStart(2, '0')}`;
        onChange(monthStr);
        setIsOpen(false);
    };

    const getMonthStatus = (year: number, monthIndex: number) => {
        const monthStr = `${year}-${String(monthIndex).padStart(2, '0')}`;
        const closing = (closings || []).find(c => c.monthStr === monthStr);
        return {
            isClosed: closing?.isClosed || false,
            hasData: !!closing
        };
    };

    const getSelectedMonthText = () => {
        const [y, m] = selectedMonth.split('-');
        const date = new Date(Number(y), Number(m) - 1);
        return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-sm min-w-[200px]"
            >
                <div>
                    <span className="block text-[10px] text-zinc-500 text-left uppercase tracking-wider font-semibold">SEÇİLİ DÖNEM</span>
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {getSelectedMonthText()}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                    {/* Year Navigation */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewYear(prev => prev - 1); }}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{viewYear}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewYear(prev => prev + 1); }}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                    </div>

                    {/* Months Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month) => {
                            const status = getMonthStatus(viewYear, month.value);
                            const isSelected = selectedMonth === `${viewYear}-${String(month.value).padStart(2, '0')}`;
                            const isCurrentMonth = new Date().getMonth() + 1 === month.value && new Date().getFullYear() === viewYear;

                            return (
                                <button
                                    key={month.value}
                                    onClick={() => handleMonthSelect(month.value)}
                                    className={`
                                        relative p-2 rounded-lg text-sm font-medium transition-all
                                        flex flex-col items-center justify-center gap-1 h-16
                                        ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                            : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }
                                        ${isCurrentMonth && !isSelected ? 'ring-2 ring-indigo-500/30' : ''}
                                    `}
                                >
                                    <span>{month.label}</span>

                                    {/* Status Indicators */}
                                    {status.isClosed && (
                                        <div className={`flex items-center gap-1 text-[10px] ${isSelected ? 'text-indigo-100' : 'text-green-600 dark:text-green-400'}`}>
                                            <CheckCircle className="w-3 h-3" />
                                            <span className="hidden sm:inline">Kapalı</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-4 text-[10px] text-zinc-500">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                            <span>Seçili</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Kapalı Dönem</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
