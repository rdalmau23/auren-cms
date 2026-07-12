"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Treatment, PageResponse, Patient, MedicationSchedule } from '@/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RoleAwareFilters } from '@/components/ui/RoleAwareFilters';
import { toast } from 'sonner';
import { SlideOver } from '@/components/ui/SlideOver';
import { Plus, CheckCircle2, XCircle, Search, CalendarDays, Save, Trash2, StopCircle, Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function TreatmentsTab() {
  const t = useTranslations('medications');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [centerId, setCenterId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  // Form State
  const [patientId, setPatientId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');

  const { data: treatmentsPage, isLoading } = useQuery({
    queryKey: ['treatments', 'global', centerId, projectId],
    queryFn: () => {
      let url = '/v1/medications/treatments?page=0&size=50';
      if (centerId) url += `&centerId=${centerId}`;
      if (projectId) url += `&projectId=${projectId}`;
      return api.get<PageResponse<Treatment>>(url);
    },
  });

  const { data: patientsPage } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get<PageResponse<Patient>>('/v1/patients?page=0&size=100'),
  });
  const patients = patientsPage?.content || [];

  const { data: schedules = [] } = useQuery({
    queryKey: ['medication_schedules'],
    queryFn: () => api.get<MedicationSchedule[]>('/v1/medications/schedules'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post<Treatment>('/v1/medications/treatments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Tratamiento asignado correctamente');
      setSlideOverOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al asignar el tratamiento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await api.put<Treatment>(`/v1/medications/treatments/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Tratamiento actualizado correctamente');
      setSlideOverOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar el tratamiento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/v1/medications/treatments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Tratamiento eliminado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar el tratamiento');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch<Treatment>(`/v1/medications/treatments/${id}/deactivate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      toast.success('Tratamiento finalizado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al finalizar el tratamiento');
    },
  });

  const resetForm = () => {
    setPatientId('');
    setScheduleId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setInstructions('');
    setEditingTreatment(null);
  };

  const handleEdit = (t: Treatment) => {
    setEditingTreatment(t);
    setPatientId(t.patientId);
    setScheduleId(t.scheduleId);
    setStartDate(t.startDate);
    setEndDate(t.endDate || '');
    setInstructions(t.notes || '');
    setSlideOverOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este tratamiento?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeactivate = (id: string) => {
    if (confirm('¿Seguro que deseas finalizar este tratamiento de forma anticipada?')) {
      deactivateMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !scheduleId || !startDate) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const payload = {
      patientId,
      scheduleId,
      startDate,
      endDate: endDate || null,
      notes: instructions || null,
    };

    if (editingTreatment) {
      updateMutation.mutate({ id: editingTreatment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const treatments = treatmentsPage?.content || [];

  const filteredTreatments = treatments.filter(t => 
    t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.scheduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.medicationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <RoleAwareFilters 
        onFiltersChange={({ centerId, projectId }) => {
          setCenterId(centerId);
          setProjectId(projectId);
        }} 
      />

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por paciente o fármaco..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <button
          onClick={() => {
            resetForm();
            setSlideOverOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Asignar Tratamiento
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pauta / Fármaco</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fechas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTreatments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarDays size={32} className="text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900">No hay tratamientos registrados</p>
                      <p className="text-xs text-gray-500 mt-1">Los tratamientos asignados aparecerán aquí.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTreatments.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-xs border border-indigo-100">
                          {t.patientName.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{t.patientName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{t.scheduleName}</p>
                      <p className="text-xs text-gray-500">{t.medicationName} {t.medicationStrength}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">
                        {format(new Date(t.startDate), "d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.endDate ? `Hasta ${format(new Date(t.endDate), "d MMM yyyy", { locale: es })}` : 'Crónico (Sin fin)'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {t.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 size={12} />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle size={12} />
                          Finalizado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(t)}
                        className="inline-flex items-center p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title={tCommon('edit')}
                      >
                        <Edit2 size={16} />
                      </button>
                      {t.active && (
                        <button
                          onClick={() => handleDeactivate(t.id)}
                          className="inline-flex items-center p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title={tCommon('deactivate')}
                        >
                          <StopCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="inline-flex items-center p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title={tCommon('delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SlideOver for Add/Edit Treatment */}
      <SlideOver
        open={isSlideOverOpen}
        onClose={() => {
          setSlideOverOpen(false);
          resetForm();
        }}
        title={editingTreatment ? "Editar Tratamiento" : "Asignar Tratamiento"}
        description={editingTreatment ? "Modifica los detalles del tratamiento asignado." : "Vincula una pauta existente a un paciente."}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
              <SearchableSelect
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.name} ${p.surname}`,
                  avatarInitials: `${p.name[0]}${p.surname[0]}`.toUpperCase()
                }))}
                value={patientId}
                onChange={setPatientId}
                placeholder="Busca y selecciona un paciente..."
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pauta / Medicamento *</label>
              <SearchableSelect
                options={schedules.map((s) => ({
                  value: s.id,
                  label: s.name,
                  sublabel: `${s.medicationName} ${s.medicationStrength || ''} - ${s.slots?.length || 0} toma(s)`
                }))}
                value={scheduleId}
                onChange={setScheduleId}
                placeholder="Selecciona la pauta..."
                searchable={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                <input 
                  type="date" 
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin (Opcional)</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones Adicionales (Opcional)</label>
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-gray-900 font-medium" 
                placeholder="Instrucciones específicas para este paciente..." 
                rows={3}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSlideOverOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Tratamiento'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
