'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { SelectOption } from './SearchableSelect';

export interface MultiSelectProps {
  options: SelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = 'Selecciona opciones...',
  emptyMessage = 'No hay opciones',
  className = '',
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const selectedOptions = options.filter(opt => values.includes(opt.value));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className={`w-full min-h-[42px] px-3 py-2 border border-neutral-200 rounded-xl bg-white hover:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition duration-200 flex flex-wrap gap-2 items-center cursor-pointer shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-sm text-neutral-400 pl-1">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedOptions.map(opt => (
              <span key={opt.value} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt.value);
                  }}
                  className="hover:bg-blue-100 p-0.5 rounded-full transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto text-neutral-400 pr-1 shrink-0">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {options.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">{emptyMessage}</p>
            ) : (
              options.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.value);
                    }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl text-left transition ${
                      isSelected ? 'bg-primary-50 text-primary-900 font-semibold' : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-neutral-300'}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    {opt.avatarInitials && (
                      <div className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                        isSelected ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'
                      }`}>
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
