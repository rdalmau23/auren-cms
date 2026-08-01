'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { User as UserIcon, Mail, Phone, Plus, Edit2 } from 'lucide-react';
import { UserProfile } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  status: string;
  roles?: { name: string }[];
  center?: { id: string; name: string };
}

interface Professional {
  id: string;
  user: User;
  speciality: string;
  licenseNumber: string;
}

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('Psicólogo');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Center & Role options
  const [role, setRole] = useState('PSYCHOLOGIST');
  const [centerId, setCenterId] = useState('');

  const roles: string[] = (session as any)?.roles || [];
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isCenterAdmin = roles.includes('CENTER_ADMIN');

  // Fetch current user profile
  const { data: currentUserProfile } = useQuery<UserProfile>({
    queryKey: ['user-me'],
    queryFn: async () => {
      return await api.get<UserProfile>('/v1/users/me');
    },
  });

  // Fetch Centers (SUPER_ADMIN only)
  const { data: centers = [] } = useQuery<any[]>({
    queryKey: ['centers'],
    queryFn: async () => {
      return await api.get<any[]>('/v1/centers');
    },
    enabled: isSuperAdmin,
  });

  // Fetch all professionals
  const { data: professionals = [], isLoading, error } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      return await api.get<Professional[]>('/v1/professionals');
    },
  });

  // Create professional mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      return await api.post<any>('/v1/professionals', newData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profesional registrado correctamente');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al registrar profesional');
      console.error(err);
    },
  });

  // Edit professional mutation
  const editMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return await api.put<any>(`/v1/professionals/${editingProfessional?.id}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      toast.success('Profesional actualizado correctamente');
      setIsEditOpen(false);
      setEditingProfessional(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar profesional');
      console.error(err);
    },
  });

  const resetForm = () => {
    setName('');
    setSurname('');
    setEmail('');
    setPhone('');
    setSpeciality('Psicólogo Clínico');
    setLicenseNumber('');
    setRole('PSYCHOLOGIST');
    setCenterId('');
  };

  const handleOpenEdit = (prof: Professional) => {
    setEditingProfessional(prof);
    setName(prof.user?.name || '');
    setSurname(prof.user?.surname || '');
    setEmail(prof.user?.email || '');
    setPhone(prof.user?.phone || '');
    setSpeciality(prof.speciality || 'Psicólogo Clínico');
    setLicenseNumber(prof.licenseNumber || '');
    setRole(prof.user?.roles?.[0]?.name || 'PSYCHOLOGIST');
    setCenterId(prof.user?.center?.id || '');
    setIsEditOpen(true);
  };

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    if (selectedRole === 'PSYCHOLOGIST') {
      setSpeciality('Psicólogo Clínico');
      if (licenseNumber === 'N/A') setLicenseNumber('');
    } else if (selectedRole === 'PSYCHIATRIST') {
      setSpeciality('Psiquiatra');
      if (licenseNumber === 'N/A') setLicenseNumber('');
    } else if (selectedRole === 'NURSE') {
      setSpeciality('Enfermero Psiquiátrico');
      if (licenseNumber === 'N/A') setLicenseNumber('');
    } else if (selectedRole === 'SOCIAL_WORKER') {
      setSpeciality('Trabajador Social');
      if (licenseNumber === 'N/A') setLicenseNumber('');
    } else if (selectedRole === 'CENTER_ADMIN') {
      setSpeciality('Administración de Centro');
      setLicenseNumber('N/A');
    }
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
      role,
      centerId: isSuperAdmin ? centerId || undefined : undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !surname || !email || !licenseNumber) {
      toast.error('Por favor, completa los campos requeridos');
      return;
    }
    editMutation.mutate({
      name,
      surname,
      email,
      phone,
      speciality,
      licenseNumber,
      role,
      centerId: isSuperAdmin ? centerId || undefined : undefined,
    });
  };

  const canEdit = (prof: Professional) => {
    const myEmail = session?.user?.email;
    if (prof.user?.email === myEmail) return true;

    const myRoles = (session as any)?.roles || [];
    const getPrecedence = (p: Professional) => {
      const rNames = p.user?.roles?.map((r: any) => r.name) || [];
      if (rNames.includes('SUPER_ADMIN')) return 3;
      if (rNames.includes('CENTER_ADMIN')) return 2;
      return 1;
    };

    const myPrecedence = myRoles.includes('SUPER_ADMIN') ? 3 : myRoles.includes('CENTER_ADMIN') ? 2 : 1;
    const targetPrecedence = getPrecedence(prof);

    if (myPrecedence === 3) {
      return targetPrecedence < 3;
    }
    if (myPrecedence === 2) {
      const myCenterId = currentUserProfile?.centerId;
      const targetCenterId = prof.user?.center?.id;
      return targetPrecedence < 2 && myCenterId === targetCenterId;
    }
    return false;
  };

  // Filter role choices based on privileges
  const getRoleOptions = () => {
    const options = [
      { value: 'PSYCHOLOGIST', label: 'Psicólogo' },
      { value: 'PSYCHIATRIST', label: 'Psiquiatra' },
      { value: 'NURSE', label: 'Enfermero/a' },
      { value: 'SOCIAL_WORKER', label: 'Trabajador Social' },
    ];
    if (isSuperAdmin) {
      options.push({ value: 'CENTER_ADMIN', label: 'Administrador de Centro' });
    }
    return options;
  };

  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'CENTER_ADMIN': return 'Admin Centro';
      case 'PSYCHOLOGIST': return 'Psicólogo';
      case 'PSYCHIATRIST': return 'Psiquiatra';
      case 'NURSE': return 'Enfermero';
      case 'SOCIAL_WORKER': return 'Trabajador Social';
      default: return roleName;
    }
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
          onClick={() => { resetForm(); setIsOpen(true); }}
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
              <UserIcon size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No hay profesionales registrados</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza invitando a un psicólogo, psiquiatra o enfermero al centro.</p>
            <Button
              variant="indigo"
              onClick={() => { resetForm(); setIsOpen(true); }}
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
              const userRoleName = prof.user?.roles?.[0]?.name || 'PSYCHOLOGIST';
              const userCenterName = prof.user?.center?.name || 'Sin Centro';
              
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
                      <p className="text-xs text-gray-400 mt-0.5">Licencia: {prof.licenseNumber || 'N/A'}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="blue" className="text-[10px]">
                          {getRoleLabel(userRoleName)}
                        </Badge>
                        <Badge variant="neutral" className="text-[10px] bg-gray-50 border border-gray-200/60 text-gray-600 font-medium">
                          {userCenterName}
                        </Badge>
                      </div>
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
                    {canEdit(prof) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(prof)}
                        className="gap-1 px-2.5 py-1 text-xs"
                      >
                        <Edit2 size={12} />
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for invite professional */}
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

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Rol de Acceso *</label>
            <SearchableSelect
              options={getRoleOptions()}
              value={role}
              onChange={handleRoleChange}
              searchable={false}
            />
          </div>

          {/* Center selector (Super Admin only) */}
          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Centro Médico *</label>
              <SearchableSelect
                options={centers.map(c => ({ value: c.id, label: c.name }))}
                value={centerId}
                onChange={setCenterId}
                placeholder="Selecciona un centro"
                searchable={true}
              />
            </div>
          )}

          {/* License Number (only for clinical roles) */}
          {role !== 'CENTER_ADMIN' && (
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
          )}

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

      {/* Modal for editing professional */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingProfessional(null); }}
        title="Editar Profesional"
        description="Modifica los datos profesionales y de cuenta del usuario."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
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

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Rol de Acceso *</label>
            <SearchableSelect
              options={getRoleOptions()}
              value={role}
              onChange={handleRoleChange}
              searchable={false}
            />
          </div>

          {/* Center selector (Super Admin only) */}
          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Centro Médico *</label>
              <SearchableSelect
                options={centers.map(c => ({ value: c.id, label: c.name }))}
                value={centerId}
                onChange={setCenterId}
                placeholder="Selecciona un centro"
                searchable={true}
              />
            </div>
          )}

          {/* License Number (only for clinical roles) */}
          {role !== 'CENTER_ADMIN' && (
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
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsEditOpen(false); setEditingProfessional(null); }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="indigo"
              isLoading={editMutation.isPending}
              className="flex-1"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
