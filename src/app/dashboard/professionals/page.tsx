'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { User, Mail, Phone, Plus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  status: string;
}

interface Professional {
  id: string;
  user: User;
  speciality: string;
  licenseNumber: string;
}

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('Psicólogo');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Fetch all professionals
  const { data: professionals = [], isLoading, error } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const response = await api.get<Professional[]>('/v1/professionals');
      return response;
    },
  });

  // Create professional mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const response = await api.post<any>('/v1/professionals', newData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profesional registrado correctamente');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error('Error al registrar profesional');
      console.error(err);
    },
  });

  const resetForm = () => {
    setName('');
    setSurname('');
    setEmail('');
    setPhone('');
    setSpeciality('Psicólogo');
    setLicenseNumber('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !surname || !email || !licenseNumber) {
      toast.error('Por favor, completa los campos requeridos');
      return;
    }
    createMutation.mutate({
      name,
      surname,
      email,
      phone,
      speciality,
      licenseNumber,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Equipo Clínico</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de profesionales y especialidades de la clínica</p>
        </div>
        <Button
          variant="indigo"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Plus size={18} />
          Invitar Profesional
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-center">
          Error al cargar el directorio de profesionales.
        </div>
      ) : professionals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto mt-6">
          <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
            <User size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay profesionales registrados</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza invitando a un psicólogo, psiquiatra o enfermero al centro.</p>
          <Button
            variant="indigo"
            onClick={() => setIsOpen(true)}
            className="mt-4"
          >
            Registrar Primer Profesional
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((prof) => {
            const userName = prof.user?.name || 'Profesional';
            const userSurname = prof.user?.surname || 'Auren';
            const initials = `${userName[0] || ''}${userSurname[0] || ''}`.toUpperCase();
            
            return (
              <div
                key={prof.id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition duration-300 p-6 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {userName} {userSurname}
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{prof.speciality}</p>
                    <p className="text-xs text-gray-400 mt-1">Licencia: {prof.licenseNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{prof.user?.email}</span>
                  </div>
                  {prof.user?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-gray-400" />
                      <span>{prof.user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="success" className="animate-in fade-in duration-500">
                    Activo
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Slide-over / Modal for invite professional */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Registrar Profesional"
        description="Crea una ficha profesional y asóciala a su cuenta de correo."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Laura"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ribera"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="laura.ribera@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="655999888"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Especialidad *</label>
              <SearchableSelect
                options={[
                  { value: 'Psiquiatra', label: 'Psiquiatra' },
                  { value: 'Psicólogo Clínico', label: 'Psicólogo Clínico' },
                  { value: 'Enfermero Psiquiátrico', label: 'Enfermero Psiquiátrico' },
                  { value: 'Trabajador Social', label: 'Trabajador Social' },
                ]}
                value={speciality}
                onChange={setSpeciality}
                searchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nº Colegiado *</label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="COL-77889"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="indigo"
              isLoading={createMutation.isPending}
              className="flex-1"
            >
              Registrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
