"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import { Patient, Pathology } from "@/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ChevronLeft, Edit2, Check, X, Activity, AlertTriangle, TrendingUp, Cigarette, User, Download } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// ─── Extracted Tab Components ────────────────────────────────
import { ClinicalTab } from "../components/ClinicalTab";
import { HabitsTab } from "../components/HabitsTab";
import { PersonalInfoTab } from "../components/PersonalInfoTab";
import { ClinicalHistoryTab } from "../components/ClinicalHistoryTab";
import { EvolutionChart } from "../components/EvolutionChart";
import { TCAModuleTab } from "../components/TCAModuleTab";
import { CopilotCard } from "../../../../components/patients/CopilotCard";

// ─── Constants ───────────────────────────────────────────────
const riskColors: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};
const riskLabels: Record<string, string> = { LOW: "Bajo", MODERATE: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" };

type TabKey = "clinical" | "habits" | "general" | "historial" | "evolucion" | "modulos" | "tca";

export default function PatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("clinical");
  const [formData, setFormData] = useState<Partial<Patient & { pathologyIds?: string[] }>>({});

  const { data: session } = useSession();
  const roles: string[] = (session as any)?.roles || [];
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const isCenterAdmin = roles.includes("CENTER_ADMIN");

  const tPathologies = useTranslations("pathologies");

  // ─── Queries ──────────────────────────────────────────────
  const { data: currentUserProfile } = useQuery<any>({
    queryKey: ["user-me"],
    queryFn: () => api.get<any>("/v1/users/me"),
  });

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: async () => {
      const response = await api.get<Patient>(`/v1/patients/${id}`);
      setFormData({ ...response, pathologyIds: response.pathologies?.map(p => p.id) || [] });
      return response;
    },
  });

  const { data: pathologies = [] } = useQuery<Pathology[]>({
    queryKey: ["pathologies"],
    queryFn: () => api.get<Pathology[]>("/v1/pathologies"),
  });

  // ─── Permissions ──────────────────────────────────────────
  const isSameCenter = patient?.centerId === currentUserProfile?.centerId;
  const isEditingAllowed = isSuperAdmin || (isCenterAdmin && isSameCenter) || (!isSuperAdmin && !isCenterAdmin);

  // ─── Mutations ────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (updatedData: any) => api.put<Patient>(`/v1/patients/${id}`, {
      name: updatedData.name, surname: updatedData.surname, email: updatedData.email,
      phone: updatedData.phone, birthDate: updatedData.birthDate, gender: updatedData.gender,
      diagnosis: updatedData.diagnosis, riskLevel: updatedData.riskLevel, status: updatedData.status,
      inactivityReason: updatedData.inactivityReason, dischargeDate: updatedData.dischargeDate,
      dni: updatedData.dni, nhc: updatedData.nhc, isSmoker: updatedData.isSmoker,
      alcoholConsumption: updatedData.alcoholConsumption, substanceUse: updatedData.substanceUse,
      sportsActivity: updatedData.sportsActivity, physicalIllnesses: updatedData.physicalIllnesses,
      familyProblems: updatedData.familyProblems, relapsesHistory: updatedData.relapsesHistory,
      hasPriorAdmissions: updatedData.hasPriorAdmissions, priorAdmissionsCount: updatedData.priorAdmissionsCount,
      lastAdmissionReason: updatedData.lastAdmissionReason, bloodType: updatedData.bloodType,
      allergies: updatedData.allergies, emergencyContactName: updatedData.emergencyContactName,
      emergencyContactPhone: updatedData.emergencyContactPhone, emergencyContactRelationship: updatedData.emergencyContactRelationship,
      civilStatus: updatedData.civilStatus, occupation: updatedData.occupation,
      educationLevel: updatedData.educationLevel, housingSituation: updatedData.housingSituation,
      pathologyIds: updatedData.pathologyIds,
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(["patient", id], data);
      setIsEditing(false);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────
  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => updateMutation.mutate(formData);
  const handleCancel = () => { setFormData(patient!); setIsEditing(false); };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const baseUrl = typeof window !== 'undefined' ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api");
      const response = await fetch(`${baseUrl}/v1/reports/patients/${id}/pdf`, {
        headers: { 'Authorization': `Bearer ${(session as any)?.accessToken}` },
      });
      if (!response.ok) throw new Error('Error al generar el informe');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_Auren_${patient?.name}_${patient?.surname}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo descargar el informe clínico');
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Loading / Error States ───────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando expediente clínico...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-xl mx-auto mt-12 text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
        <h3 className="text-lg font-semibold text-red-800">Error al cargar paciente</h3>
        <p className="text-sm text-red-600 mt-1">No se ha podido recuperar la información del servidor.</p>
        <Link href="/dashboard/patients" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-800">
          <ChevronLeft size={16} /> Volver al directorio
        </Link>
      </div>
    );
  }

  // ─── Tab Definitions ──────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; show?: boolean; accent?: string }[] = [
    { key: "clinical", label: "Ficha Clínica y Antecedentes", icon: <Activity size={16} /> },
    { key: "habits", label: "Hábitos y Estilo de Vida", icon: <Cigarette size={16} /> },
    { key: "general", label: "Información Personal y Demográfica", icon: <User size={16} /> },
    { key: "historial", label: "Historial Clínico", icon: <Activity size={16} /> },
    { key: "evolucion", label: "Evolución", icon: <TrendingUp size={16} /> },
    { key: "tca", label: `${tPathologies("title")} TCA`, icon: <Activity size={16} />, show: patient.pathologies?.some(p => p.code === 'TCA'), accent: "orange" },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between shrink-0">
        <Link href="/dashboard/patients" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft size={16} /> Volver a Pacientes
        </Link>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
              <X size={16} /> Cancelar
            </button>
            <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50">
              <Check size={16} /> {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : isEditingAllowed && (
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadReport} disabled={isDownloading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer shadow-sm disabled:opacity-50">
              <Download size={16} /> {isDownloading ? "Generando..." : "Descargar Informe"}
            </button>
            <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
              <Edit2 size={16} /> Editar Ficha
            </button>
          </div>
        )}
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl border border-blue-200">
            {patient.name[0]}{patient.surname[0]}
          </div>
          <div>
            {isEditing ? (
              <div className="flex gap-2 mb-2">
                <input type="text" value={formData.name || ""} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Nombre" className="px-3 py-1 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 font-semibold" />
                <input type="text" value={formData.surname || ""} onChange={(e) => handleInputChange("surname", e.target.value)} placeholder="Apellidos" className="px-3 py-1 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 font-semibold" />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{patient.name} {patient.surname}</h1>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${riskColors[formData.riskLevel || "LOW"]}`}>
                Riesgo: {riskLabels[formData.riskLevel || "LOW"]}
              </span>
              <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">{patient.centerName}</span>
              <span className="text-xs text-gray-400">ID: {patient.id}</span>
            </div>
          </div>
        </div>
        {isEditing && (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Nivel de Riesgo</label>
            <SearchableSelect
              options={[
                { value: 'LOW', label: 'Bajo' },
                { value: 'MODERATE', label: 'Moderado' },
                { value: 'HIGH', label: 'Alto' },
                { value: 'CRITICAL', label: 'Crítico' },
              ]}
              value={formData.riskLevel || 'LOW'}
              onChange={(val) => handleInputChange("riskLevel", val)}
              searchable={false}
            />
          </div>
        )}
      </div>

      {/* AI Copilot */}
      {!isEditing && <CopilotCard patientId={id} />}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 shrink-0">
        {tabs.filter(t => t.show !== false).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? `border-${tab.accent || 'blue'}-600 text-${tab.accent || 'blue'}-600 font-semibold`
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2">{tab.icon} {tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 p-6 overflow-y-auto">
        {activeTab === "clinical" && (
          <ClinicalTab patient={patient} formData={formData} isEditing={isEditing} pathologies={pathologies} onInputChange={handleInputChange} onFormDataChange={setFormData} />
        )}
        {activeTab === "habits" && (
          <HabitsTab patient={patient} formData={formData} isEditing={isEditing} onInputChange={handleInputChange} />
        )}
        {activeTab === "general" && (
          <PersonalInfoTab patient={patient} formData={formData} isEditing={isEditing} onInputChange={handleInputChange} />
        )}
        {activeTab === "historial" && (
          <ClinicalHistoryTab patientId={id} />
        )}
        {activeTab === "evolucion" && (
          <div className="h-full flex flex-col justify-center pb-8">
            <EvolutionChart patientId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
