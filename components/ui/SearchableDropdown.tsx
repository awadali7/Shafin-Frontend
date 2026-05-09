"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

type Props = {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: boolean;
    disabled?: boolean;
};

export default function SearchableDropdown({ options, value, onChange, placeholder = "Search...", error, disabled }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function select(option: string) {
        onChange(option);
        setOpen(false);
        setQuery("");
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange("");
        setQuery("");
    }

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => {
                    if (disabled) return;
                    setOpen(o => !o);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between cursor-pointer bg-white
                    ${error ? "border-red-300" : "border-gray-300"}
                    ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : "hover:border-gray-400"}
                    focus-within:ring-2 focus-within:ring-[#B00000] focus-within:border-transparent`}
            >
                {open ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        placeholder={placeholder}
                        className="flex-1 outline-none text-sm bg-transparent"
                    />
                ) : (
                    <span className={`flex-1 text-sm truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
                        {value || placeholder}
                    </span>
                )}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                    {value && !open && (
                        <button onClick={clear} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                    ) : (
                        filtered.map(option => (
                            <div
                                key={option}
                                onClick={() => select(option)}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#B00000] hover:text-white transition-colors
                                    ${option === value ? "bg-red-50 font-medium text-[#B00000]" : "text-gray-800"}`}
                            >
                                {option}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
