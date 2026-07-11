"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Center, Patient, PatientCreateRequest } from "@/types";

export default function NewPatientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"personal" | "clinical" | "habits" | "emergency">("personal");

  // Form State
  const [formData, setFormData] = useState({
    // User account info
    name: "",
    surname: "",
    email: "",
    phone: "",
    
    // Clinical & Admin info
    centerId: "",
    primaryProfessionalId: "",
    extraProfessionalIds: [] as string[],
    birthDate: "",
    gender: "MALE",
    diagnosis: "",
    riskLevel: "LOW",
    admissionDate: new Date().toISOString().split("T")[0],
    
    // Habits
    isSmoker: false,
    alcoholConsumption: "NONE",
    substanceUse: "",
    sportsActivity: "NONE",
    physicalIllnesses: "",
    familyProblems: "",
    relapsesHistory: "",

    // Demographics & Admissions
    hasPriorAdmissions: false,
    priorAdmissionsCount: 0,
    lastAdmissionReason: "",
    bloodType: "",
    allergies: "",
    
    // Emergency contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    
    // Status & Admin
    civilStatus: "SINGLE",
    occupation: "",
    educationLevel: "",
    housingSituation: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  const { data: session } = useSession();
  const roles: string[] = (session as any)?.roles || [];
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('CENTER_ADMIN');

  // Fetch Centers
  const { data: centers = [] } = useQuery<Center[]>({
    queryKey: ["centers"],
    queryFn: async () => {
      const response = await api.get<Center[]>("/v1/centers");
      if (response && response.length > 0) {
        setFormData((prev) => ({ ...prev, centerId: prev.centerId || response[0].id }));
      }
      return response;
    },
    enabled: isSuperAdmin,
  });

  // Fetch Professionals
  const { data: professionals = [] } = useQuery<any[]>({
    queryKey: ['professionals', (session as any)?.accessToken],
    queryFn: async () => {
      const token = (session as any)?.accessToken;
      if (!token) return [];
      const response = await api.get<any[]>('/v1/professionals', { token });
      return response;
    },
    enabled: isAdmin && !!(session as any)?.accessToken,
  });

  // Create Patient Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: PatientCreateRequest) => {
      return await api.post<Patient>("/v1/patients", payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      router.push(`/dashboard/patients/${data.id}`);
    },
    onError: (err: any) => {
      setFormError(err.message || "Ocurrió un error al registrar al paciente. Revisa los datos e inténtalo de nuevo.");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!formData.name || !formData.surname || !formData.email) {
      setFormError("Los campos Nombre, Apellidos y Correo Electrónico son obligatorios.");
      setActiveTab("personal");
      return;
    }
    if (isSuperAdmin && !formData.centerId) {
      setFormError("El Centro Médico es obligatorio.");
      setActiveTab("clinical");
      return;
    }

    const payload: PatientCreateRequest = {
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone || undefined,
      centerId: isSuperAdmin ? formData.centerId : undefined,
      primaryProfessionalId: isAdmin ? formData.primaryProfessionalId || undefined : undefined,
      extraProfessionalIds: isAdmin ? formData.extraProfessionalIds : undefined,
      birthDate: formData.birthDate || undefined,
      gender: formData.gender,
      diagnosis: formData.diagnosis || undefined,
      riskLevel: formData.riskLevel,
      admissionDate: formData.admissionDate || undefined,
      isSmoker: formData.isSmoker,
      alcoholConsumption: formData.alcoholConsumption,
      substanceUse: formData.substanceUse || undefined,
      sportsActivity: formData.sportsActivity,
      physicalIllnesses: formData.physicalIllnesses || undefined,
      familyProblems: formData.familyProblems || undefined,
      relapsesHistory: formData.relapsesHistory || undefined,
      hasPriorAdmissions: formData.hasPriorAdmissions,
      priorAdmissionsCount: Number(formData.priorAdmissionsCount),
      lastAdmissionReason: formData.lastAdmissionReason || undefined,
      bloodType: formData.bloodType || undefined,
      allergies: formData.allergies || undefined,
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
      civilStatus: formData.civilStatus,
      occupation: formData.occupation || undefined,
      educationLevel: formData.educationLevel || undefined,
      housingSituation: formData.housingSituation || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full h-full pb-6">
      {/* Top navigation header */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar nuevo paciente</h1>
          <p className="text-sm text-gray-500">Crea un nuevo expediente clínico y cuenta de usuario</p>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Error al guardar</p>
            <p className="text-xs opacity-90 mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 flex-shrink-0 mb-4">
        <nav className="flex gap-6" aria-label="Tabs">
          {[
            { id: "personal", label: "Datos Personales" },
            { id: "clinical", label: "Información Clínica" },
            { id: "habits", label: "Hábitos y Entorno" },
            { id: "emergency", label: "Contacto de Emergencia" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scrollable Card */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl overflow-y-auto shadow-sm">
        {/* Tab 1: Datos Personales */}
        {activeTab === "personal" && (
          <div className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Información básica y contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Carlos"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. López"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. carlos.lopez@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. 600123456"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Género
              </label>
              <SearchableSelect
                options={[
                  { value: 'MALE', label: 'Masculino' },
                  { value: 'FEMALE', label: 'Femenino' },
                  { value: 'OTHER', label: 'Otro / No binario' },
                ]}
                value={formData.gender}
                onChange={(val) => setFormData((prev) => ({ ...prev, gender: val }))}
                searchable={false}
              />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 border-b pb-3 pt-4">Datos demográficos y ocupación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Estado Civil
              </label>
              <SearchableSelect
                options={[
                  { value: 'SINGLE', label: 'Soltero/a' },
                  { value: 'MARRIED', label: 'Casado/a' },
                  { value: 'DIVORCED', label: 'Divorciado/a' },
                  { value: 'WIDOWED', label: 'Viudo/a' },
                  { value: 'PARTNER', label: 'Unión libre' },
                ]}
                value={formData.civilStatus}
                onChange={(val) => setFormData((prev) => ({ ...prev, civilStatus: val }))}
                searchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Ocupación o Trabajo
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Contable, Estudiante, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nivel Académico
              </label>
              <input
                type="text"
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Universitaria, Secundaria, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Situación de Vivienda
              </label>
              <input
                type="text"
                name="housingSituation"
                value={formData.housingSituation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Piso de alquiler propio, Vive con padres, etc."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Información Clínica */}
      {activeTab === "clinical" && (
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Información de Ingreso y Diagnóstico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {isSuperAdmin && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Centro Médico Asignado <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={centers.map((center) => ({
                    value: center.id,
                    label: center.name,
                    sublabel: center.type,
                  }))}
                  value={formData.centerId}
                  onChange={(val) => setFormData((prev) => ({ ...prev, centerId: val }))}
                  searchable={true}
                />
              </div>
            )}
            
            {isAdmin ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Profesional Principal
                  </label>
                  <SearchableSelect
                    options={professionals.map(prof => ({
                      value: prof.id,
                      label: `${prof.user?.name} ${prof.user?.surname}`,
                      sublabel: prof.speciality,
                      avatarInitials: `${prof.user?.name?.[0] || ''}${prof.user?.surname?.[0] || ''}`.toUpperCase()
                    }))}
                    value={formData.primaryProfessionalId}
                    onChange={(val) => setFormData((prev) => ({ ...prev, primaryProfessionalId: val }))}
                    placeholder="Selecciona un profesional"
                    searchable={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Profesionales Adicionales
                  </label>
                  <MultiSelect
                    options={professionals.filter(p => p.id !== formData.primaryProfessionalId).map(prof => ({
                      value: prof.id,
                      label: `${prof.user?.name} ${prof.user?.surname}`,
                      sublabel: prof.speciality,
                      avatarInitials: prof.user?.name?.[0]?.toUpperCase()
                    }))}
                    values={formData.extraProfessionalIds}
                    onChange={(values) => setFormData(prev => ({ ...prev, extraProfessionalIds: values }))}
                    placeholder="Seleccionar adicionales..."
                    emptyMessage="No hay más profesionales"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Serás asignado automáticamente como el Profesional Principal de este paciente al guardar.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nivel de Riesgo Clínico
              </label>
              <SearchableSelect
                options={[
                  { value: 'LOW', label: 'Bajo' },
                  { value: 'MODERATE', label: 'Moderado' },
                  { value: 'HIGH', label: 'Alto' },
                  { value: 'CRITICAL', label: 'Crítico' },
                ]}
                value={formData.riskLevel}
                onChange={(val) => setFormData((prev) => ({ ...prev, riskLevel: val }))}
                searchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Grupo Sanguíneo
              </label>
              <input
                type="text"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. A+, O-, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Alergias Conocidas
              </label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Penicilina, marisco, polen..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Diagnóstico Principal
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Escribe el diagnóstico médico y notas iniciales del paciente..."
              />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 border-b pb-3 pt-4">Historial de Ingresos Anteriores</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasPriorAdmissions"
                name="hasPriorAdmissions"
                checked={formData.hasPriorAdmissions}
                onChange={(e) => handleCheckboxChange("hasPriorAdmissions", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasPriorAdmissions" className="text-sm font-semibold text-gray-700">
                ¿Ha tenido ingresos previos en este u otros centros de salud mental?
              </label>
            </div>

            {formData.hasPriorAdmissions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Nº de ingresos previos
                  </label>
                  <input
                    type="number"
                    name="priorAdmissionsCount"
                    value={formData.priorAdmissionsCount}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Motivo del último ingreso
                  </label>
                  <input
                    type="text"
                    name="lastAdmissionReason"
                    value={formData.lastAdmissionReason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ej. Ideación suicida, crisis psicótica..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Hábitos y Entorno */}
      {activeTab === "habits" && (
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Hábitos y Estilo de Vida</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Consumo de Tabaco
              </label>
              <div className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  id="isSmoker"
                  name="isSmoker"
                  checked={formData.isSmoker}
                  onChange={(e) => handleCheckboxChange("isSmoker", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isSmoker" className="text-sm font-semibold text-gray-700">
                  Es fumador activo
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Consumo de Alcohol
              </label>
              <SearchableSelect
                options={[
                  { value: 'NONE', label: 'No consume' },
                  { value: 'OCCASIONAL', label: 'Ocasional (social)' },
                  { value: 'FREQUENT', label: 'Frecuente / Abuso' },
                ]}
                value={formData.alcoholConsumption}
                onChange={(val) => setFormData((prev) => ({ ...prev, alcoholConsumption: val }))}
                searchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Actividad Deportiva
              </label>
              <SearchableSelect
                options={[
                  { value: 'NONE', label: 'Sedentario' },
                  { value: 'OCCASIONAL', label: 'Ocasional (1-2 veces/sem)' },
                  { value: 'REGULAR', label: 'Regular (3+ veces/sem)' },
                ]}
                value={formData.sportsActivity}
                onChange={(val) => setFormData((prev) => ({ ...prev, sportsActivity: val }))}
                searchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Otras sustancias o adicciones
              </label>
              <input
                type="text"
                name="substanceUse"
                value={formData.substanceUse}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Cannabis ocasional en fin de semana"
              />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 border-b pb-3 pt-4">Antecedentes y Entorno Familiar</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Enfermedades Físicas o Comorbilidades
              </label>
              <textarea
                name="physicalIllnesses"
                value={formData.physicalIllnesses}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Ej. Hipotiroidismo, hipertensión, diabetes..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Problemas Familiares o Sociales
              </label>
              <textarea
                name="familyProblems"
                value={formData.familyProblems}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Ej. Falta de apoyo familiar, conflictos en el hogar..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Historial de Recaídas
              </label>
              <textarea
                name="relapsesHistory"
                value={formData.relapsesHistory}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Detalla si ha tenido recaídas previas y los factores que las desencadenaron..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Contacto de Emergencia */}
      {activeTab === "emergency" && (
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Contacto Directo de Emergencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. Marta López"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. 600999888"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Relación o Parentesco
              </label>
              <input
                type="text"
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ej. SISTER, MOTHER, FATHER, FRIEND, SPOUSE"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3 mt-6">
            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              La información del contacto de emergencia se mostrará de forma destacada en la ficha del paciente para un acceso rápido en caso de crisis o incidencias clínicas graves.
            </p>
          </div>
        </div>
      )}

      </div>

      {/* Form Actions Footer */}
      <div className="flex justify-end gap-3 pt-4 flex-shrink-0">
        <Link
          href="/dashboard/patients"
          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {createMutation.isPending ? "Registrando..." : "Registrar Paciente"}
        </button>
      </div>
    </form>
  );
}
