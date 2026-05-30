'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface Patient {
  id: string;
  name: string;
  surname: string;
  email?: string;
}

interface Professional {
  id: string;
  user: User;
  speciality: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  professionalId: string;
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [type, setType] = useState('INDIVIDUAL');
  const [notes, setNotes] = useState('');

  // Fetch logged-in user profile to get professionalId
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await api.get<UserProfile>('/v1/users/me');
      return response;
    },
  });

  // Set default professional to self when profile loads
  if (profile?.professionalId && !selectedProfessionalId) {
    setSelectedProfessionalId(profile.professionalId);
  }

  // Fetch appointments for this professional
  const { data: appointmentsResponse, isLoading: loadingAppointments } = useQuery<{ content: Appointment[] }>({
    queryKey: ['appointments', profile?.professionalId],
    queryFn: async () => {
      if (!profile?.professionalId) return { content: [] };
      const response = await api.get<{ content: Appointment[] }>(
        `/v1/appointments/professional/${profile.professionalId}?size=50`
      );
      return response;
    },
    enabled: !!profile?.professionalId,
  });

  const appointments = appointmentsResponse?.content || [];

  // Fetch patients list
  const { data: patientsResponse } = useQuery<{ content: Patient[] }>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get<{ content: Patient[] }>('/v1/patients?size=100');
      return response;
    },
  });
  const patients = patientsResponse?.content || [];

  // Dropdown search & visibility states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter patients locally
  const filteredPatients = patients.filter((pat) => {
    const fullName = `${pat.name || ''} ${pat.surname || ''}`.toLowerCase();
    const email = pat.email?.toLowerCase() || '';
    const query = dropdownSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Fetch professionals list
  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const response = await api.get<Professional[]>('/v1/professionals');
      return response;
    },
  });

  // Schedule Appointment Mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const response = await api.post<any>('/v1/appointments', newData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita agendada correctamente');
      // Clear form
      setSelectedPatientId('');
      setDate('');
      setStartTimeStr('');
      setEndTimeStr('');
      setNotes('');
    },
    onError: (err: any) => {
      toast.error('Error al agendar la cita. Verifica la disponibilidad.');
      console.error(err);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedProfessionalId || !date || !startTimeStr || !endTimeStr) {
      toast.error('Completa los campos requeridos');
      return;
    }

    // Combine date and time strings to Instant ISO String
    const startIso = new Date(`${date}T${startTimeStr}:00`).toISOString();
    const endIso = new Date(`${date}T${endTimeStr}:00`).toISOString();

    createMutation.mutate({
      patientId: selectedPatientId,
      professionalId: selectedProfessionalId,
      startTime: startIso,
      endTime: endIso,
      type,
      notes,
    });
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar esta cita?')) return;
    try {
      await api.patch(`/v1/appointments/${id}/cancel`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita cancelada con éxito');
    } catch (err) {
      toast.error('Error al cancelar la cita');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agenda Médica</h1>
        <p className="mt-1 text-sm text-gray-500">Administra las visitas y sesiones clínicas del centro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Timeline Scheduler */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Visitas Agendadas</h2>

            {loadingAppointments ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No hay citas registradas para tu agenda profesional.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((app) => {
                    const start = new Date(app.startTime);
                    const formattedDate = format(start, "eeee, d 'de' MMMM", { locale: es });
                    const formattedTime = `${format(start, 'HH:mm')} - ${format(new Date(app.endTime), 'HH:mm')}`;

                    return (
                      <div
                        key={app.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition ${
                          app.status === 'CANCELLED'
                            ? 'bg-gray-50/50 border-gray-100 opacity-60'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-4 min-w-0">
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 font-bold shrink-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                              {format(start, 'MMM', { locale: es })}
                            </span>
                            <span className="text-base leading-none">{format(start, 'dd')}</span>
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {app.patientName}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">{formattedDate} ({formattedTime})</p>
                            {app.notes && (
                              <p className="text-xs text-gray-400 italic mt-1 truncate max-w-md">“{app.notes}”</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-4 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                              app.status === 'SCHEDULED'
                                ? 'bg-blue-50 text-blue-700'
                                : app.status === 'COMPLETED'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {app.status === 'SCHEDULED'
                              ? 'Pendiente'
                              : app.status === 'COMPLETED'
                              ? 'Completada'
                              : 'Cancelada'}
                          </span>

                          {app.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                              title="Cancelar cita"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - New Appointment Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4">Nueva Sesión / Cita</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Paciente *</label>
            <div className="relative" ref={dropdownRef}>
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
                  className="w-full text-sm pl-4 pr-10 py-3 border border-neutral-200 rounded-xl bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition duration-200 text-left shadow-sm font-medium"
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
                              setSelectedPatientId(pat.id);
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Profesional *</label>
              <select
                required
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-black placeholder-neutral-500 font-medium bg-white"
              >
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.user?.name} {prof.user?.surname} ({prof.speciality})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-black placeholder-neutral-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Inicio *</label>
                <input
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-black placeholder-neutral-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Fin *</label>
                <input
                  type="time"
                  required
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-black placeholder-neutral-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Cita *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-black placeholder-neutral-500 font-medium bg-white"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="GROUP">Grupal / Familiar</option>
                <option value="EMERGENCY">Crisis / Urgencia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notas / Motivo</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ej. Sesión regular de control de impulsos..."
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition duration-200 text-neutral-900 placeholder:text-neutral-400"
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition duration-200 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Agendando...' : 'Agendar Visita'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
