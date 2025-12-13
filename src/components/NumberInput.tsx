import { ChevronUp, ChevronDown } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    placeholder?: string;
    description?: string; // Optional unit or description like 'adet', 'kg'
}

export function NumberInput({ value, onChange, min = 0, max, step = 1, className = '', placeholder, description }: NumberInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Prevent scrolling from changing the number when focused
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (document.activeElement === inputRef.current) {
                e.preventDefault();
            }
        };

        const currentInput = inputRef.current;
        if (currentInput) {
            currentInput.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (currentInput) {
                currentInput.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    const handleIncrement = () => {
        const newValue = value + step;
        if (max !== undefined && newValue > max) return;
        onChange(Number(newValue.toFixed(2))); // Fix potential floating point issues
    };

    const handleDecrement = () => {
        const newValue = value - step;
        if (min !== undefined && newValue < min) return;
        onChange(Number(newValue.toFixed(2)));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(0); // Or handle empty state if needed, but for now 0 is safe usually
            return;
        }
        const num = parseFloat(val);
        if (!isNaN(num)) {
            onChange(num);
        }
    };

    return (
        <div className={`relative flex items-center bg-zinc-800 rounded-lg group focus-within:ring-1 focus-within:ring-indigo-500 transition-all ${className}`}>
            <input
                ref={inputRef}
                type="number"
                value={value || ''}
                onChange={handleChange}
                onFocus={(e) => e.target.select()} // Auto-select content on focus/click
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                className="w-full bg-transparent border-none text-white px-2 py-1.5 focus:ring-0 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-mono text-center tracking-tight"
            />

            {description && (
                <span className="text-xs text-zinc-500 mr-2 pointer-events-none select-none">
                    {description}
                </span>
            )}

            <div className="flex flex-col border-l border-zinc-700/50">
                <button
                    type="button"
                    onClick={handleIncrement}
                    className="px-1 h-[50%] hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors flex items-center justify-center rounded-tr-lg active:scale-95"
                    tabIndex={-1} // Skip tab index for buttons
                >
                    <ChevronUp size={10} />
                </button>
                <button
                    type="button"
                    onClick={handleDecrement}
                    className="px-1 h-[50%] hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors flex items-center justify-center rounded-br-lg border-t border-zinc-700/30 active:scale-95"
                    tabIndex={-1}
                >
                    <ChevronDown size={10} />
                </button>
            </div>
        </div>
    );
}
