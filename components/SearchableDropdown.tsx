
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, MapPin, X } from 'lucide-react';

interface SearchableDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    ringColor?: string;
    className?: string;
    restrictedKeys?: Record<string, { label: string, isBlocked: boolean }>;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select Option",
    icon = <MapPin size={18} />,
    ringColor = "focus:ring-indigo-50",
    className = "",
    restrictedKeys = {}
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sortedOptions = [...options].sort((a, b) => {
        const aRestriction = restrictedKeys[a];
        const bRestriction = restrictedKeys[b];

        // Only push to bottom if isBlocked is true
        const aBlocked = aRestriction?.isBlocked;
        const bBlocked = bRestriction?.isBlocked;

        if (aBlocked && !bBlocked) return 1;
        if (!aBlocked && bBlocked) return -1;

        return a.localeCompare(b);
    });

    const filteredOptions = sortedOptions.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                    {icon}
                </div>
                <input
                    type="text"
                    readOnly
                    value={value}
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setSearchTerm("");
                    }}
                    placeholder={placeholder}
                    className={`w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 ${ringColor} font-bold text-slate-700 cursor-pointer transition-all`}
                />
                <ChevronDown
                    size={18}
                    className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-50 z-[100] p-4 animate-in zoom-in-95 duration-200">
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 font-bold text-sm text-slate-600"
                        />
                    </div>

                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm flex items-center justify-between group ${value === option
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : restrictedKeys[option]
                                            ? 'text-red-500 hover:bg-red-50'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span>{option}</span>
                                        {restrictedKeys[option] && (
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                                                {restrictedKeys[option].label}
                                            </span>
                                        )}
                                    </div>
                                    {value === option && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>}
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No areas found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
