"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { Medication } from '@/types';
import { SlideOver } from '@/components/ui/SlideOver';
import { Pill, Droplet, Search, Plus, MoreHorizontal } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export function CatalogTab() {
  const t = useTranslations('medications');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [name, setName] = useState("");
  const [activeSubstance, setActiveSubstance] = useState("");
  const [formType, setFormType] = useState('TABLET');
  const [strength, setStrength] = useState("");

  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: () => api.get<Medication[]>('/v1/medications'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post<Medication>('/v1/medications', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setSlideOverOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName("");
    setActiveSubstance("");
    setFormType("TABLET");
    setStrength("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createMutation.mutate({
      name,
      activeSubstance: activeSubstance || undefined,
      form: formType,
      strength: strength || undefined
    });
  };

  const getFormIcon = (form: string) => {
    switch (form?.toUpperCase()) {
      case 'LIQUID':
      case 'DROPS':
        return <Droplet size={18} className="text-teal-500" />;
      default:
        return <Pill size={18} className="text-blue-500" />;
    }
  };

  const filteredMeds = medications?.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.activeSubstance?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o principio activo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <button
          onClick={() => setSlideOverOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nuevo fármaco
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fármaco</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Principio activo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Forma / Dosis</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMeds?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-500">
                    No se encontraron fármacos.
                  </td>
                </tr>
              ) : (
                filteredMeds?.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                          {getFormIcon(med.form)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{med.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{med.activeSubstance || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {t(`form.${med.form.toLowerCase()}` as any)}
                        </span>
                        {med.strength && (
                          <span className="text-sm text-gray-500">{med.strength}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SlideOver for New Medication */}
      <SlideOver
        open={isSlideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Nuevo fármaco"
        description="Añade un medicamento a la base de datos de Auren."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre comercial *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                placeholder="Ej. Orfidal" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principio activo</label>
              <input 
                type="text" 
                value={activeSubstance}
                onChange={(e) => setActiveSubstance(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                placeholder="Ej. Lorazepam" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma</label>
                <SearchableSelect
                  options={[
                    { value: 'TABLET', label: 'Comprimido' },
                    { value: 'CAPSULE', label: 'Cápsula' },
                    { value: 'LIQUID', label: 'Líquido' },
                    { value: 'INJECTION', label: 'Inyectable' },
                  ]}
                  value={formType}
                  onChange={setFormType}
                  searchable={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosis (Strength)</label>
                <input 
                  type="text" 
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Ej. 1mg" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSlideOverOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar fármaco'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
