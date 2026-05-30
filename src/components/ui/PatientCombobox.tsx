import React, { useState, useEffect, useRef } from 'react';

interface Patient {
  id: string;
  name: string;
  surname: string;
  email?: string;
}

interface PatientComboboxProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  label?: string;
}

export const PatientCombobox: React.FC<PatientComboboxProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  label,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const filteredPatients = patients.filter((pat) => {
    const searchLower = dropdownSearch.toLowerCase();
    const fullName = `${pat.name} ${pat.surname}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (pat.email && pat.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder={selectedPatient ? `${selectedPatient.name} ${selectedPatient.surname}` : "Elige un paciente de la lista..."}
          value={isDropdownOpen ? dropdownSearch : (selectedPatient ? `${selectedPatient.name} ${selectedPatient.surname}` : '')}
          onChange={(e) => {
            setDropdownSearch(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            setIsDropdownOpen(true);
            setDropdownSearch('');
          }}
          className="w-full text-sm pl-4 pr-10 py-3 border border-neutral-200 rounded-xl bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition duration-200 text-left shadow-sm font-medium text-black placeholder-neutral-500"
        />
        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            if (!isDropdownOpen) setDropdownSearch('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition p-1"
        >
          <span className="block transition-transform duration-200 text-[10px]" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </button>
      </div>

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No se encontraron pacientes</p>
            ) : (
              filteredPatients.map((pat) => {
                const isSelected = pat.id === selectedPatientId;
                const initials = `${pat.name?.[0] || ''}${pat.surname?.[0] || ''}`.toUpperCase();
                return (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => {
                      onSelectPatient(pat.id);
                      setIsDropdownOpen(false);
                      setDropdownSearch('');
                    }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-primary-50 text-primary-900 font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                      isSelected ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {pat.name} {pat.surname}
                      </p>
                      {pat.email && (
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">{pat.email}</p>
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
};
