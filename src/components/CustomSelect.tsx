import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = searchable
        ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Dropdown menu is in a portal, so we need to check if the click was inside the menu too
                // But typically the portal is outside the container.
                // However, since we close on click outside, we also need to check if the click was on the portal content.
                // A simpler way with portals is usually to handle clicks on the window/document and check if target is inside container OR inside the portal element.
                // For now, let's keep it simple: if we click outside the trigger button, close it.
                // We will add a check for the portal element strictly if needed, but usually closing on outside click works fine if we stop propagation inside the dropdown.
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false); // Close on scroll to avoid position issues for now
        }

        if (isOpen) {
            window.addEventListener('click', handleClickOutside);
            window.addEventListener('scroll', handleScroll, { capture: true });
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent immediate closing
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    // Portal Menu Component
    const PortalMenu = () => {
        if (!isOpen) return null;

        return createPortal(
            <div
                className="fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                style={{
                    top: position.top - window.scrollY, // Fixed position needs screen relative coords
                    left: position.left - window.scrollX,
                    width: position.width,
                    maxHeight: '300px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
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
            </div>,
            document.body
        );
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={toggleOpen}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-white flex items-center justify-between cursor-pointer hover:border-zinc-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                <span className={`truncate mr-2 ${selectedOption ? 'text-white' : 'text-zinc-500'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-zinc-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <PortalMenu />
        </div>
    );
}
