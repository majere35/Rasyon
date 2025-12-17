import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CustomDatePickerProps {
    value: string; // ISO Date "YYYY-MM-DD"
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
}

export function CustomDatePicker({ value, onChange, placeholder = 'Tarih Seç', className = '' }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    // Sync viewDate if value changes externally
    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                portalRef.current &&
                !portalRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        const handleScroll = (event: Event) => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            window.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, { capture: true });
            window.addEventListener('resize', handleScroll);
        }
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(rect.width, 280) // Min width for calendar
            });
        }
        setIsOpen(!isOpen);
    };

    // Calendar Logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Monday start (0=Mon, 6=Sun)
    };

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Correct for timezone offset issues by using local string directly formatting
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
        setIsOpen(false);
    };

    const formatDateTR = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    };

    // Portal Menu
    const PortalMenu = () => {
        if (!isOpen) return null;

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

        return createPortal(
            <div
                ref={portalRef}
                className="fixed z-[9999] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-4"
                style={{
                    top: position.top - window.scrollY,
                    left: position.left - window.scrollX,
                    width: '300px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="font-semibold text-zinc-900 dark:text-white">
                        {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {dayNames.map(d => (
                        <div key={d} className="text-xs font-medium text-zinc-400 py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map(i => <div key={`blank-${i}`} />)}
                    {days.map(day => {
                        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = value === dateStr;
                        const isToday = dateStr === new Date().toISOString().slice(0, 10);

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors
                                    ${isSelected
                                        ? 'bg-indigo-600 text-white font-medium'
                                        : isToday
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-900'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={toggleOpen}
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white flex items-center justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                <div className="flex items-center gap-2 truncate mr-2">
                    <CalendarIcon size={16} className="text-zinc-500" />
                    <span className={value ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}>
                        {value ? formatDateTR(value) : placeholder}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-zinc-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <PortalMenu />
        </div>
    );
}
