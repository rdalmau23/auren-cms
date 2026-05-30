"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Save, AlertCircle, CheckCircle, RefreshCw, Building, User, Globe } from "lucide-react";
import { api } from "@/lib/api-client";
import { UserProfile, Center } from "@/types";
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function SettingsPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    surname: "",
    phone: "",
    language: "es",
    speciality: "",
    licenseNumber: "",
  });

  const [centerForm, setCenterForm] = useState({
    id: "",
    name: "",
    type: "",
    address: "",
    phone: "",
    email: "",
  });

  // 1. Fetch current logged-in professional user details
  const { isLoading: loadingUser, error: userError, refetch: refetchUser } = useQuery<UserProfile>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const data = await api.get<UserProfile>("/v1/users/me");
      if (data) {
        setProfileForm({
          name: data.name || "",
          surname: data.surname || "",
          phone: data.phone || "",
          language: data.language || "es",
          speciality: data.speciality || "",
          licenseNumber: data.licenseNumber || "",
        });
      }
      return data;
    },
  });

  // 2. Fetch all active centers (we will update the first one or the assigned center)
  const { isLoading: loadingCenter, error: centerError } = useQuery<Center[]>({
    queryKey: ["centers-settings"],
    queryFn: async () => {
      const response = await api.get<Center[]>("/v1/centers");
      if (response && response.length > 0) {
        const center = response[0]; // Seeded center is first
        setCenterForm({
          id: center.id,
          name: center.name || "",
          type: center.type || "",
          address: center.address || "",
          phone: center.phone || "",
          email: center.email || "",
        });
      }
      return response;
    },
  });

  // 3. Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: typeof profileForm) => {
      return await api.put<UserProfile>("/v1/users/me", payload);
    },
    onSuccess: () => {
      setSuccessMessage("Perfil profesional actualizado con éxito.");
      setTimeout(() => setSuccessMessage(null), 4000);
      refetchUser();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Error al actualizar perfil.");
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  // 4. Center update mutation
  const updateCenterMutation = useMutation({
    mutationFn: async (payload: typeof centerForm) => {
      return await api.put<Center>(`/v1/centers/${payload.id}`, payload);
    },
    onSuccess: () => {
      setSuccessMessage("Configuración de centro médico guardada con éxito.");
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Error al actualizar configuración del centro.");
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCenterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCenterForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const saveCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerForm.id) return;
    updateCenterMutation.mutate(centerForm);
  };

  const isLoading = loadingUser || loadingCenter;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-96"></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={24} className="text-gray-500" />
          Configuración general
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra tu perfil profesional y la configuración del centro clínico.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <form onSubmit={saveProfile} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              Perfil Profesional
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="surname"
                  value={profileForm.surname}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ej. +34 600123456"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Especialidad
                </label>
                <input
                  type="text"
                  name="speciality"
                  value={profileForm.speciality}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ej. Psiquiatra, Psicólogo Clínico..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Nº Colegiado / Licencia
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={profileForm.licenseNumber}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ej. COL-12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Globe size={14} /> Idioma de la interfaz
              </label>
              <SearchableSelect
                options={[
                  { value: 'es', label: 'Español (es)' },
                  { value: 'en', label: 'English (en)' },
                ]}
                value={profileForm.language}
                onChange={(val) => setProfileForm((prev) => ({ ...prev, language: val }))}
                searchable={false}
              />
            </div>
          </div>

          <div className="pt-6 border-t mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {updateProfileMutation.isPending ? "Guardando..." : "Guardar Perfil"}
            </button>
          </div>
        </form>

        {/* Medical Center Settings */}
        <form onSubmit={saveCenter} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
              <Building size={18} className="text-emerald-500" />
              Configuración del Centro Clínico
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nombre de la Clínica
              </label>
              <input
                type="text"
                name="name"
                value={centerForm.name}
                onChange={handleCenterChange}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Tipo de Centro
                </label>
                <SearchableSelect
                  options={[
                    { value: 'CLINIC', label: 'Clínica' },
                    { value: 'HOSPITAL', label: 'Hospital' },
                    { value: 'PRIVATE_PRACTICE', label: 'Consulta Privada' },
                    { value: 'HEALTH_CENTER', label: 'Centro de Salud' },
                  ]}
                  value={centerForm.type}
                  onChange={(val) => setCenterForm((prev) => ({ ...prev, type: val }))}
                  searchable={false}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Teléfono del Centro
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={centerForm.phone}
                  onChange={handleCenterChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={centerForm.email}
                onChange={handleCenterChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Dirección Física
              </label>
              <input
                type="text"
                name="address"
                value={centerForm.address}
                onChange={handleCenterChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ej. Calle Mayor, 12, Planta 1"
              />
            </div>
          </div>

          <div className="pt-6 border-t mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateCenterMutation.isPending || !centerForm.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {updateCenterMutation.isPending ? "Guardando..." : "Guardar Centro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
