import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    searchable?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = 'Seçiniz...', className = '', searchable = false }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = searchable
        ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-white flex items-center justify-between cursor-pointer hover:border-zinc-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {searchable && (
                        <div className="p-2 border-b border-zinc-800">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ara..."
                                    className="w-full bg-zinc-800 text-sm text-white rounded pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${option.value === value
                                            ? 'bg-indigo-500/10 text-indigo-400'
                                            : 'text-zinc-300 hover:bg-zinc-800'
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {option.value === value && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-zinc-500">
                                Sonuç bulunamadı
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
