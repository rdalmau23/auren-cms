'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useSession } from 'next-auth/react';
import { SlideOver } from '@/components/ui/SlideOver';
import { AppointmentCalendar, AppointmentEvent } from './components/AppointmentCalendar';
import { CalendarIcon, Plus } from 'lucide-react';

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
  const t = useTranslations('appointments');
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const sessionLoading = status === 'loading';
  const roles: string[] = (session as any)?.roles || [];
  const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('CENTER_ADMIN');

  // Helpers to get initial date and rounded hours YYYY-MM-DD and HH:MM
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRoundedLocalTimeStrings = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const formatTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    const start = formatTime(now);
    now.setHours(now.getHours() + 1);
    const end = formatTime(now);

    return { start, end };
  };

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [type, setType] = useState('INDIVIDUAL');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentEvent | null>(null);

  // Fetch logged-in user profile to get professionalId
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ['userProfile', (session as any)?.accessToken],
    queryFn: async () => {
      const token = (session as any)?.accessToken;
      if (!token) return null;
      const response = await api.get<UserProfile>('/v1/users/me', { token });
      return response;
    },
    enabled: !!(session as any)?.accessToken,
  });

  // Set default professional to self when profile loads
  if (profile?.professionalId && !selectedProfessionalId) {
    setSelectedProfessionalId(profile.professionalId);
  }

  // Fetch appointments (all if admin, specific professional if not)
  const { data: appointmentsResponse, isLoading: loadingAppointments } = useQuery<{ content: Appointment[] }>({
    queryKey: ['appointments', isAdmin, profile?.professionalId, (session as any)?.accessToken],
    queryFn: async () => {
      const token = (session as any)?.accessToken;
      if (!token) return { content: [] };
      if (isAdmin) {
        const response = await api.get<{ content: Appointment[] }>('/v1/appointments?size=100', { token });
        return response;
      } else {
        if (!profile?.professionalId) return { content: [] };
        const response = await api.get<{ content: Appointment[] }>(
          `/v1/appointments/professional/${profile.professionalId}?size=50`,
          { token }
        );
        return response;
      }
    },
    enabled: !sessionLoading && !!(session as any)?.accessToken && (isAdmin || !!profile?.professionalId),
  });

  const appointments = appointmentsResponse?.content || [];

  const filteredAppointments = appointments.filter((app) => {
    const now = new Date();
    const isPastDate = new Date(app.startTime) < now;

    if (activeTab === 'cancelled') {
      return app.status === 'CANCELLED' || app.status === 'NO_SHOW';
    }

    if (app.status === 'CANCELLED' || app.status === 'NO_SHOW') {
      return false;
    }

    if (activeTab === 'upcoming') {
      return !isPastDate && app.status !== 'COMPLETED';
    }

    if (activeTab === 'past') {
      return isPastDate || app.status === 'COMPLETED';
    }

    return true;
  });

  const calendarEvents: AppointmentEvent[] = appointments.map((app) => ({
    id: app.id,
    title: `${app.patientName} - ${app.type}`,
    start: new Date(app.startTime),
    end: new Date(app.endTime),
    resource: app,
  }));

  useEffect(() => {
    console.log("AppointmentsPage Debug info:");
    console.log("- Status:", status);
    console.log("- Session:", session);
    console.log("- Roles:", roles);
    console.log("- isAdmin:", isAdmin);
    console.log("- Profile:", profile);
    console.log("- Appointments loaded:", appointments);
  }, [status, session, roles, isAdmin, profile, appointments]);

  // Fetch patients list
  const { data: patientsResponse } = useQuery<{ content: Patient[] }>({
    queryKey: ['patients', (session as any)?.accessToken],
    queryFn: async () => {
      const token = (session as any)?.accessToken;
      if (!token) return { content: [] };
      const response = await api.get<{ content: Patient[] }>('/v1/patients?size=100', { token });
      return response;
    },
    enabled: !!(session as any)?.accessToken,
  });
  const patients = patientsResponse?.content || [];

  // Patient options for SearchableSelect
  const patientOptions = patients.map((pat) => ({
    value: pat.id,
    label: `${pat.name} ${pat.surname}`,
    sublabel: pat.email,
    avatarInitials: `${pat.name?.[0] || ''}${pat.surname?.[0] || ''}`.toUpperCase(),
  }));

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Fetch professionals list
  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals', (session as any)?.accessToken],
    queryFn: async () => {
      const token = (session as any)?.accessToken;
      if (!token) return [];
      const response = await api.get<Professional[]>('/v1/professionals', { token });
      return response;
    },
    enabled: !!(session as any)?.accessToken,
  });

  // Schedule Appointment Mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const token = (session as any)?.accessToken;
      const response = await api.post<any>('/v1/appointments', newData, { token });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('successSchedule'));
      // Clear form
      setSelectedPatientId('');
      setDate(getLocalDateString());
      setStartTimeStr('09:00');
      setEndTimeStr('10:00');
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(t('errorSchedule'));
      console.error(err);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedProfessionalId || !date || !startTimeStr || !endTimeStr) {
      toast.error(t('requiredFields'));
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
    if (!confirm(t('confirmCancel'))) return;
    try {
      const token = (session as any)?.accessToken;
      await api.patch(`/v1/appointments/${id}/cancel`, {}, { token });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('successCancel'));
    } catch (err) {
      toast.error(t('errorCancel'));
      console.error(err);
    }
  };


  return (
    <>
      <div className="flex flex-col h-full space-y-6 overflow-hidden">
        <div className="shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('pageTitle')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('pageSubtitle')}</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl transition shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newAppointment')}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
        <AppointmentCalendar 
          events={calendarEvents} 
          isAdmin={isAdmin} 
          onSelectEvent={(event) => setSelectedAppointment(event)}
        />
      </div>
      </div>

      {/* SlideOver for New Appointment Form */}
      <SlideOver
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('newSession')}
        description={t('pageSubtitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('patient')} *</label>
            <SearchableSelect
              options={patientOptions}
              value={selectedPatientId}
              onChange={setSelectedPatientId}
              placeholder={t('selectPatient')}
              emptyMessage={t('noPatientsFound')}
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('professional')} *</label>
              <SearchableSelect
                options={professionals.map(prof => ({
                  value: prof.id,
                  label: `${prof.user?.name} ${prof.user?.surname}`,
                  sublabel: prof.speciality,
                  avatarInitials: `${prof.user?.name?.[0] || ''}${prof.user?.surname?.[0] || ''}`.toUpperCase()
                }))}
                value={selectedProfessionalId}
                onChange={setSelectedProfessionalId}
                placeholder={t('selectProfessional')}
                searchable={true}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('date')} *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-neutral-900 placeholder-neutral-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('startTime')} *</label>
              <input
                type="time"
                required
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-neutral-900 placeholder-neutral-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('endTime')} *</label>
              <input
                type="time"
                required
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-neutral-900 placeholder-neutral-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('appointmentType')} *</label>
            <SearchableSelect
              options={[
                { value: 'INDIVIDUAL', label: t('type.individual') },
                { value: 'GROUP', label: t('type.group') },
                { value: 'EMERGENCY', label: t('type.emergency') },
              ]}
              value={type}
              onChange={setType}
              searchable={false}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">{t('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition duration-200 text-neutral-900 placeholder:text-neutral-400"
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2.5 mt-4 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            {createMutation.isPending ? t('scheduling') : t('scheduleButton')}
          </button>
        </form>
      </SlideOver>

      {/* SlideOver for Appointment Details */}
      <SlideOver
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Detalles de la Visita"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3">
              <div>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('patient')}</span>
                <p className="text-sm font-bold text-neutral-900">{selectedAppointment.resource.patientName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('date')}</span>
                  <p className="text-sm font-medium text-neutral-900">
                    {format(selectedAppointment.start, "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('time')}</span>
                  <p className="text-sm font-medium text-neutral-900">
                    {format(selectedAppointment.start, "HH:mm")} - {format(selectedAppointment.end, "HH:mm")}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('appointmentType')}</span>
                <p className="text-sm font-medium text-neutral-900">{selectedAppointment.resource.type}</p>
              </div>

              {isAdmin && (
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('professional')}</span>
                  <p className="text-sm font-medium text-neutral-900">{selectedAppointment.resource.professionalName}</p>
                </div>
              )}
              
              <div>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</span>
                <p className="text-sm font-medium text-neutral-900">{selectedAppointment.resource.status}</p>
              </div>
            </div>

            {selectedAppointment.resource.notes && (
              <div>
                <span className="block text-xs font-semibold text-neutral-700 mb-1">{t('notes')}</span>
                <div className="bg-white border border-neutral-200 rounded-xl p-4 text-sm text-neutral-700">
                  {selectedAppointment.resource.notes}
                </div>
              </div>
            )}

            {selectedAppointment.resource.status === 'SCHEDULED' && selectedAppointment.start > new Date() && (
              <div className="pt-4 border-t border-neutral-100">
                <button
                  onClick={() => {
                    handleCancelAppointment(selectedAppointment.resource.id);
                    setSelectedAppointment(null);
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-danger-600 bg-danger-50 rounded-xl hover:bg-danger-100 transition duration-200 cursor-pointer"
                >
                  {t('cancelAppointment')}
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </>
  );
}
