import { ChevronUp, ChevronDown } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

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
    // Local state to handle the input string, allowing for "0," or "0." intermediate states
    const [localValue, setLocalValue] = useState(value?.toString() || '');

    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state with prop value when prop changes externally
    useEffect(() => {
        // Only update if the parsed local value is different to avoid cursor jumps or undoing user typing
        const numericLocal = parseFloat(localValue.replace(',', '.'));
        if (value !== undefined && value !== null && !isNaN(value) && (isNaN(numericLocal) || numericLocal !== value)) {
            // If the user's current input formats to the same number, don't overwrite (to keep "0,50" vs "0.5")
            // But if it's completely different, sync it.
            // Simple approach: if they differ significantly, update.
            setLocalValue(value.toString());
        }
    }, [value]);


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
        const currentVal = parseFloat(localValue.replace(',', '.')) || 0;
        const newValue = currentVal + step;
        if (max !== undefined && newValue > max) return;

        const stepPrecision = step.toString().split('.')[1]?.length || 0;
        const precision = Math.max(stepPrecision, 2);

        const nextVal = Number(newValue.toFixed(precision));
        onChange(nextVal);
        setLocalValue(nextVal.toString());
    };

    const handleDecrement = () => {
        const currentVal = parseFloat(localValue.replace(',', '.')) || 0;
        const newValue = currentVal - step;
        if (min !== undefined && newValue < min) return;

        const stepPrecision = step.toString().split('.')[1]?.length || 0;
        const precision = Math.max(stepPrecision, 2);

        const nextVal = Number(newValue.toFixed(precision));
        onChange(nextVal);
        setLocalValue(nextVal.toString());
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // Allow digits, one dot or comma, and optional negative sign
        // But we just want to update local state freely, validation on parsing
        // We might want to restrict non-numeric chars though to act like type="number"
        if (!/^[0-9.,-]*$/.test(val)) {
            return;
        }

        // Handle multiple decimals check?
        // (val.match(/[.,]/g) || []).length > 1 -> prevent
        if ((val.match(/[.,]/g) || []).length > 1) {
            return;
        }

        setLocalValue(val);

        if (val === '' || val === '-' || val === ',' || val === '.') {
            // Don't fire onChange for incomplete numbers, or maybe fire 0?
            // Usually valid to wait.
            return;
        }

        const normalized = val.replace(',', '.');
        const num = parseFloat(normalized);

        if (!isNaN(num)) {
            onChange(num);
        }
    };

    const handleBlur = () => {
        // On blur, format properly? Or keep as is?
        // Maybe just ensure it matches the prop value to ensure consistency
        if (value !== undefined && value !== null) {
            setLocalValue(value.toString());
        }
    };

    return (
        <div className={`relative flex items-center bg-zinc-800 rounded-lg group focus-within:ring-1 focus-within:ring-indigo-500 transition-all ${className}`}>
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                placeholder={placeholder}
                className="w-full bg-transparent border-none text-white px-2 py-1.5 focus:ring-0 focus:outline-none appearance-none font-mono text-center tracking-tight"
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
                    tabIndex={-1}
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
