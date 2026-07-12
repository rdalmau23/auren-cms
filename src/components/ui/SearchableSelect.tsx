'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  avatarInitials?: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción...',
  searchable = true,
  emptyMessage = 'No se encontraron opciones',
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) => {
        const query = search.toLowerCase();
        return (
          opt.label.toLowerCase().includes(query) ||
          opt.sublabel?.toLowerCase().includes(query)
        );
      })
    : options;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={isOpen ? search : (selectedOption ? selectedOption.label : '')}
          onChange={(e) => {
            if (searchable) {
              setSearch(e.target.value);
            }
            setIsOpen(true);
          }}
          onFocus={(e) => {
            if (!isOpen) {
              setIsOpen(true);
            }
            setSearch('');
          }}
          onMouseDown={(e) => {
            if (!searchable) {
              e.preventDefault(); // Prevents onFocus from firing on click
              setIsOpen(!isOpen);
            }
          }}
          readOnly={!searchable}
          className={`w-full text-sm pl-4 pr-10 py-2.5 border border-neutral-200 rounded-xl bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition duration-200 text-left shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${!searchable ? 'cursor-pointer' : ''}`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
            if (!isOpen && searchable) setSearch('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition p-1 disabled:opacity-50"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">{emptyMessage}</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-primary-50 text-primary-900 font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {opt.avatarInitials && (
                      <div
                        className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                          isSelected ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'
                        }`}
                      >
                        {opt.avatarInitials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {opt.label}
                      </p>
                      {opt.sublabel && (
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
