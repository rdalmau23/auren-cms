"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MedicationSchedule, Medication } from '@/types';
import { SlideOver } from '@/components/ui/SlideOver';
import { Clock, Plus, Trash2, Calendar, Pill, Save, Edit2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toast } from 'sonner';

export function SchedulesTab() {
  const queryClient = useQueryClient();
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MedicationSchedule | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [medicationId, setMedicationId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [slots, setSlots] = useState<{ time: string; quantity: number; unit: string }[]>([
    { time: '08:00', quantity: 1, unit: 'PILL' }
  ]);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['medication_schedules'],
    queryFn: () => api.get<MedicationSchedule[]>('/v1/medications/schedules'),
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => api.get<Medication[]>('/v1/medications'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post<MedicationSchedule>('/v1/medications/schedules', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication_schedules'] });
      toast.success('Pauta creada correctamente');
      setSlideOverOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al crear la pauta');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await api.put<MedicationSchedule>(`/v1/medications/schedules/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication_schedules'] });
      toast.success('Pauta actualizada correctamente');
      setSlideOverOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar la pauta');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/v1/medications/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication_schedules'] });
      toast.success('Pauta eliminada correctamente');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar la pauta. Es posible que esté en uso por algún tratamiento activo.');
    },
  });

  const resetForm = () => {
    setName('');
    setMedicationId('');
    setInstructions('');
    setSlots([{ time: '08:00', quantity: 1, unit: 'PILL' }]);
    setEditingSchedule(null);
  };

  const handleEdit = (schedule: MedicationSchedule) => {
    setEditingSchedule(schedule);
    setName(schedule.name);
    setMedicationId(schedule.medicationId);
    setInstructions(schedule.instructions || '');
    setSlots(schedule.slots.map(s => ({
      time: s.time,
      quantity: s.quantity,
      unit: s.unit
    })));
    setSlideOverOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta pauta?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !medicationId || slots.length === 0) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const payload = {
      name,
      medicationId,
      instructions,
      slots
    };

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addSlot = () => {
    setSlots([...slots, { time: '14:00', quantity: 1, unit: 'PILL' }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: string, value: string | number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pautas predefinidas</h2>
          <p className="text-sm text-gray-500">Plantillas de dosificación reutilizables para los pacientes.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setSlideOverOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Nueva pauta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : schedules?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
            <Calendar size={24} className="text-blue-500" />
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No hay pautas creadas</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm text-center">Crea tu primera pauta para agilizar la asignación de tratamientos a los pacientes.</p>
          <button 
            onClick={() => {
              resetForm();
              setSlideOverOpen(true);
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Crear primera pauta &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules?.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col group relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 pr-14">{schedule.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    <Pill size={14} className="text-blue-500" />
                    <span>{schedule.medicationName} {schedule.medicationStrength}</span>
                  </div>
                </div>
                <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(schedule)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    onClick={() => handleDelete(schedule.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {schedule.instructions && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {schedule.instructions}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tomas programadas</p>
                <div className="space-y-2">
                  {schedule.slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{slot.time}</span>
                      </div>
                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                        {slot.quantity} {slot.unit.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SlideOver
        open={isSlideOverOpen}
        onClose={() => {
          setSlideOverOpen(false);
          resetForm();
        }}
        title={editingSchedule ? "Editar Pauta" : "Nueva Pauta (Schedule)"}
        description={editingSchedule ? "Actualiza la configuración de tomas de esta pauta." : "Crea una plantilla de tomas para un fármaco."}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Pauta *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium" 
                placeholder="Ej. Orfidal 1mg (Noche)" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fármaco *</label>
              <SearchableSelect
                options={medications.map(med => ({
                  value: med.id,
                  label: med.name,
                  sublabel: `${med.activeSubstance || ''} - ${med.form}`
                }))}
                value={medicationId}
                onChange={setMedicationId}
                placeholder="Selecciona el medicamento..."
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones Generales</label>
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-gray-900 font-medium" 
                placeholder="Ej. Tomar con alimentos, no mezclar con alcohol..." 
                rows={3}
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Tomas Diarias *</label>
                <button
                  type="button"
                  onClick={addSlot}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Añadir Toma
                </button>
              </div>

              <div className="space-y-3">
                {slots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Hora</label>
                      <input 
                        type="time" 
                        required
                        value={slot.time}
                        onChange={(e) => updateSlot(idx, 'time', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                      <input 
                        type="number" 
                        required
                        min="0.5"
                        step="0.5"
                        value={slot.quantity}
                        onChange={(e) => updateSlot(idx, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
                      <SearchableSelect
                        options={[
                          { value: 'PILL', label: 'Pastilla(s)' },
                          { value: 'DROPS', label: 'Gota(s)' },
                          { value: 'MG', label: 'mg' },
                          { value: 'ML', label: 'ml' },
                          { value: 'PUFF', label: 'Inhalación(es)' },
                        ]}
                        value={slot.unit}
                        onChange={(val) => updateSlot(idx, 'unit', val)}
                        searchable={false}
                      />
                    </div>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(idx)}
                        className="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
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
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Pauta'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
