'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Equipo Clínico</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de profesionales y especialidades de la clínica</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition duration-200 shadow-sm"
        >
          + Invitar Profesional
        </button>
      </div>

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
            👤
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay profesionales registrados</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza invitando a un psicólogo, psiquiatra o enfermero al centro.</p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition duration-200"
          >
            Registrar Primer Profesional
          </button>
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
                    <span>✉️</span>
                    <span className="truncate">{prof.user?.email}</span>
                  </div>
                  {prof.user?.phone && (
                    <div className="flex items-center space-x-2">
                      <span>📞</span>
                      <span>{prof.user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Activo</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over / Modal for invite professional */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-gray-950 mb-1">Registrar Profesional</h2>
            <p className="text-xs text-gray-500 mb-4">Crea una ficha profesional y asóciala a su cuenta de correo.</p>

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
                  <select
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Psiquiatra">Psiquiatra</option>
                    <option value="Psicólogo Clínico">Psicólogo Clínico</option>
                    <option value="Enfermero Psiquiátrico">Enfermero Psiquiátrico</option>
                    <option value="Trabajador Social">Trabajador Social</option>
                  </select>
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
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
