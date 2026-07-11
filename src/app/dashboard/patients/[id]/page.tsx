"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Patient, Appointment, Treatment, DailyMood, SurveyResponse, PageResponse } from "@/types";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  ChevronLeft, Edit2, Check, X, Shield, Activity, 
  User, Heart, Cigarette, Beer, HelpCircle, Dumbbell, AlertTriangle,
  Flame, ShieldAlert, PhoneCall, UserPlus, Calendar, Pill, Brain, ClipboardList,
  Smile, Frown, Meh, TrendingUp, CheckCircle2, Clock
} from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvolutionChart } from '../components/EvolutionChart';

const riskColors = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

const riskLabels = { LOW: "Bajo", MODERATE: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" };

export default function PatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"clinical" | "habits" | "general" | "historial" | "evolucion">("clinical");

  // Local form state for updates
  const [formData, setFormData] = useState<Partial<Patient>>({});

  // Query patient data
  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: async () => {
      const response = await api.get<Patient>(`/v1/patients/${id}`);
      setFormData(response);
      return response;
    },
  });

  // Mutation to update patient data
  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<Patient>) => {
      return await api.put<Patient>(`/v1/patients/${id}`, {
        birthDate: updatedData.birthDate,
        gender: updatedData.gender,
        diagnosis: updatedData.diagnosis,
        riskLevel: updatedData.riskLevel,
        status: updatedData.status,
        isSmoker: updatedData.isSmoker,
        alcoholConsumption: updatedData.alcoholConsumption,
        substanceUse: updatedData.substanceUse,
        sportsActivity: updatedData.sportsActivity,
        physicalIllnesses: updatedData.physicalIllnesses,
        familyProblems: updatedData.familyProblems,
        relapsesHistory: updatedData.relapsesHistory,
        hasPriorAdmissions: updatedData.hasPriorAdmissions,
        priorAdmissionsCount: updatedData.priorAdmissionsCount,
        lastAdmissionReason: updatedData.lastAdmissionReason,
        bloodType: updatedData.bloodType,
        allergies: updatedData.allergies,
        emergencyContactName: updatedData.emergencyContactName,
        emergencyContactPhone: updatedData.emergencyContactPhone,
        emergencyContactRelationship: updatedData.emergencyContactRelationship,
        civilStatus: updatedData.civilStatus,
        occupation: updatedData.occupation,
        educationLevel: updatedData.educationLevel,
        housingSituation: updatedData.housingSituation,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["patient", id], data);
      setIsEditing(false);
    },
  });

  // ─── Clinical History Queries ──────────────────────────────
  const { data: appointmentsPage } = useQuery<PageResponse<Appointment>>({
    queryKey: ['patient-appointments', id],
    queryFn: () => api.get<PageResponse<Appointment>>(`/v1/appointments/patient/${id}?size=20&sort=startTime,desc`),
    enabled: !!id && activeTab === 'historial',
  });

  const { data: activeTreatments } = useQuery<Treatment[]>({
    queryKey: ['patient-treatments-active', id],
    queryFn: () => api.get<Treatment[]>(`/v1/medications/treatments/patient/${id}/active`),
    enabled: !!id && activeTab === 'historial',
  });

  const { data: patientMoodsData } = useQuery<DailyMood[]>({
    queryKey: ['patient-moods', id],
    queryFn: () => api.get<DailyMood[]>(`/v1/moods/patient/${id}?size=10`),
    enabled: !!id && activeTab === 'historial',
  });

  const { data: surveyResponsesPage } = useQuery<PageResponse<SurveyResponse>>({
    queryKey: ['patient-survey-responses', id],
    queryFn: () => api.get<PageResponse<SurveyResponse>>(`/v1/surveys/responses/patient/${id}?size=10`),
    enabled: !!id && activeTab === 'historial',
  });

  const patientAppointments = appointmentsPage?.content ?? [];
  const patientMoods = patientMoodsData ?? [];
  const patientSurveyResponses = surveyResponsesPage?.content ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(patient);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center justify-between shrink-0">
        <Link 
          href="/dashboard/patients" 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Volver a Pacientes
        </Link>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              <X size={16} />
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
          >
            <Edit2 size={16} />
            Editar Ficha
          </button>
        )}
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl border border-blue-200">
            {patient.name[0]}{patient.surname[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name} {patient.surname}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${riskColors[formData.riskLevel || "LOW"]}`}>
                Riesgo: {riskLabels[formData.riskLevel || "LOW"]}
              </span>
              <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                {patient.centerName}
              </span>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab("clinical")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "clinical" 
              ? "border-blue-600 text-blue-600 font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity size={16} />
            Ficha Clínica y Antecedentes
          </span>
        </button>
        <button
          onClick={() => setActiveTab("habits")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "habits" 
              ? "border-blue-600 text-blue-600 font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <Cigarette size={16} />
            Hábitos y Estilo de Vida
          </span>
        </button>
        <button
          onClick={() => setActiveTab("general")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "general" 
              ? "border-blue-600 text-blue-600 font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <User size={16} />
            Información Personal y Demográfica
          </span>
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "historial" 
              ? "border-blue-600 text-blue-600 font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity size={16} />
            Historial Clínico
          </span>
        </button>
        <button
          onClick={() => setActiveTab("evolucion")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "evolucion" 
              ? "border-blue-600 text-blue-600 font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <TrendingUp size={16} />
            Evolución
          </span>
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 p-6 overflow-y-auto">
        {activeTab === "clinical" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              Antecedentes y Diagnóstico Clínico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Diagnosis */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Diagnóstico Principal</label>
                {isEditing ? (
                  <textarea
                    value={formData.diagnosis || ""}
                    onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                    rows={3}
                    placeholder="Detalla el diagnóstico principal..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[48px]">
                    {patient.diagnosis || "No especificado"}
                  </p>
                )}
              </div>

              {/* Physical Illnesses */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                  <Heart size={14} className="text-red-500" />
                  Enfermedades Físicas
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.physicalIllnesses || ""}
                    onChange={(e) => handleInputChange("physicalIllnesses", e.target.value)}
                    rows={3}
                    placeholder="Indica enfermedades físicas crónicas, patologías o condiciones médicas..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[80px] whitespace-pre-line">
                    {patient.physicalIllnesses || "Ninguna enfermedad física declarada."}
                  </p>
                )}
              </div>

              {/* Allergies */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                  <ShieldAlert size={14} className="text-amber-500" />
                  Alergias e Intolerancias
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.allergies || ""}
                    onChange={(e) => handleInputChange("allergies", e.target.value)}
                    rows={3}
                    placeholder="Alergias a medicamentos, alimentos u otras sustancias..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[80px] whitespace-pre-line">
                    {patient.allergies || "No se registran alergias conocidas."}
                  </p>
                )}
              </div>

              {/* Family Problems */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                  <HelpCircle size={14} className="text-purple-500" />
                  Problemas Familiares y Sociales
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.familyProblems || ""}
                    onChange={(e) => handleInputChange("familyProblems", e.target.value)}
                    rows={4}
                    placeholder="Conflictos familiares, dinámicas relacionales complejas o estresores sociales..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[100px] whitespace-pre-line">
                    {patient.familyProblems || "Sin incidentes familiares relevantes."}
                  </p>
                )}
              </div>

              {/* Relapses History */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Historial de Recaídas
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.relapsesHistory || ""}
                    onChange={(e) => handleInputChange("relapsesHistory", e.target.value)}
                    rows={4}
                    placeholder="Episodios anteriores, recaídas previas y factores detonantes..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[100px] whitespace-pre-line">
                    {patient.relapsesHistory || "No se registran antecedentes de recaídas clínicas."}
                  </p>
                )}
              </div>

              {/* Prior Admissions History */}
              <div className="flex flex-col gap-6 md:col-span-2 border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Flame size={16} className="text-red-500" />
                  Historial de Ingresos Psiquiátricos / Médicos
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Has Prior Admissions */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">¿Ha tenido ingresos previos?</label>
                    {isEditing ? (
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            checked={formData.hasPriorAdmissions === true}
                            onChange={() => handleInputChange("hasPriorAdmissions", true)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Sí, tiene antecedentes
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            checked={formData.hasPriorAdmissions === false}
                            onChange={() => {
                              handleInputChange("hasPriorAdmissions", false);
                              handleInputChange("priorAdmissionsCount", 0);
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Ninguno
                        </label>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium">
                        {patient.hasPriorAdmissions ? "Sí, registra ingresos previos" : "Sin ingresos previos"}
                      </p>
                    )}
                  </div>

                  {/* Prior Admissions Count */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Número de ingresos anteriores</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        disabled={!formData.hasPriorAdmissions}
                        value={formData.priorAdmissionsCount ?? 0}
                        onChange={(e) => handleInputChange("priorAdmissionsCount", parseInt(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-sm text-gray-800">
                        {patient.hasPriorAdmissions ? `${patient.priorAdmissionsCount} ingresos` : "0"}
                      </p>
                    )}
                  </div>

                  {/* Last Admission Reason */}
                  <div className="flex flex-col gap-1.5 md:col-span-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Motivo del Último Ingreso</label>
                    {isEditing ? (
                      <textarea
                        disabled={!formData.hasPriorAdmissions}
                        value={formData.lastAdmissionReason || ""}
                        onChange={(e) => handleInputChange("lastAdmissionReason", e.target.value)}
                        rows={2}
                        placeholder="Detalle el motivo clínico del último ingreso hospitalario..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[48px]">
                        {patient.lastAdmissionReason || "No especificado"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "habits" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Cigarette size={18} className="text-blue-600" />
              Estilo de Vida y Hábitos Diarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Is Smoker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">¿Fuma tabaco?</label>
                {isEditing ? (
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.isSmoker === true}
                        onChange={() => handleInputChange("isSmoker", true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Sí, fumador
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.isSmoker === false}
                        onChange={() => handleInputChange("isSmoker", false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      No, no fumador
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-gray-800 font-medium">
                    {patient.isSmoker ? "Fumador activo" : "No fumador"}
                  </p>
                )}
              </div>

              {/* Alcohol Consumption */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Consumo de Bebidas Alcohólicas</label>
                {isEditing ? (
                  <SearchableSelect
                    options={[
                      { value: 'NONE', label: 'Ninguno / Abstemio' },
                      { value: 'OCCASIONAL', label: 'Ocasional / Social' },
                      { value: 'FREQUENT', label: 'Frecuente / Abuso' },
                    ]}
                    value={formData.alcoholConsumption || 'NONE'}
                    onChange={(val) => handleInputChange("alcoholConsumption", val)}
                    searchable={false}
                  />
                ) : (
                  <p className="text-sm text-gray-800 font-medium flex items-center gap-1.5">
                    <Beer size={16} className="text-amber-500" />
                    {patient.alcoholConsumption === "NONE" && "Abstemio"}
                    {patient.alcoholConsumption === "OCCASIONAL" && "Ocasional / Social"}
                    {patient.alcoholConsumption === "FREQUENT" && "Frecuente"}
                  </p>
                )}
              </div>

              {/* Sports Activity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Ejercicio Físico / Deporte</label>
                {isEditing ? (
                  <SearchableSelect
                    options={[
                      { value: 'NONE', label: 'Sedentario / Ninguno' },
                      { value: 'OCCASIONAL', label: 'Actividad física ocasional' },
                      { value: 'REGULAR', label: 'Práctica regular / Frecuente' },
                    ]}
                    value={formData.sportsActivity || 'NONE'}
                    onChange={(val) => handleInputChange("sportsActivity", val)}
                    searchable={false}
                  />
                ) : (
                  <p className="text-sm text-gray-800 font-medium flex items-center gap-1.5">
                    <Dumbbell size={16} className="text-blue-500" />
                    {patient.sportsActivity === "NONE" && "Sedentario"}
                    {patient.sportsActivity === "OCCASIONAL" && "Actividad física ocasional"}
                    {patient.sportsActivity === "REGULAR" && "Deportista regular"}
                  </p>
                )}
              </div>

              {/* Substance Use */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Otras Sustancias o Adicciones</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.substanceUse || ""}
                    onChange={(e) => handleInputChange("substanceUse", e.target.value)}
                    placeholder="Otros consumos o dependencias de interés clínico..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-sm text-gray-800 font-medium">
                    {patient.substanceUse || "No se declara consumo de otras sustancias."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "general" && (
          <div className="space-y-8">
            {/* Section 1: Demographics */}
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Información Personal y Demografía
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Birth Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Fecha de Nacimiento</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString("es-ES") : "No especificada"}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Género</label>
                  {isEditing ? (
                    <SearchableSelect
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'MALE', label: 'Masculino' },
                        { value: 'FEMALE', label: 'Femenino' },
                        { value: 'OTHER', label: 'Otro / No binario' },
                      ]}
                      value={formData.gender || ''}
                      onChange={(val) => handleInputChange("gender", val)}
                      searchable={false}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {patient.gender === "MALE" && "Masculino"}
                      {patient.gender === "FEMALE" && "Femenino"}
                      {patient.gender === "OTHER" && "Otro / No binario"}
                      {!patient.gender && "No especificado"}
                    </p>
                  )}
                </div>

                {/* Blood Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Grupo Sanguíneo</label>
                  {isEditing ? (
                    <SearchableSelect
                      options={[
                        { value: '', label: 'Desconocido...' },
                        { value: 'A+', label: 'A positivo (A+)' },
                        { value: 'A-', label: 'A negativo (A-)' },
                        { value: 'B+', label: 'B positivo (B+)' },
                        { value: 'B-', label: 'B negativo (B-)' },
                        { value: 'AB+', label: 'AB positivo (AB+)' },
                        { value: 'AB-', label: 'AB negativo (AB-)' },
                        { value: 'O+', label: 'O positivo (O+)' },
                        { value: 'O-', label: 'O negativo (O-)' },
                      ]}
                      value={formData.bloodType || ''}
                      onChange={(val) => handleInputChange("bloodType", val)}
                      searchable={false}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {patient.bloodType || "No declarado"}
                    </p>
                  )}
                </div>

                {/* Civil Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Estado Civil</label>
                  {isEditing ? (
                    <SearchableSelect
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'SINGLE', label: 'Soltero/a' },
                        { value: 'MARRIED', label: 'Casado/a' },
                        { value: 'DIVORCED', label: 'Divorciado/a' },
                        { value: 'WIDOWED', label: 'Viudo/a' },
                        { value: 'COHABITING', label: 'Unión de hecho' },
                      ]}
                      value={formData.civilStatus || ''}
                      onChange={(val) => handleInputChange("civilStatus", val)}
                      searchable={false}
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {patient.civilStatus === "SINGLE" && "Soltero/a"}
                      {patient.civilStatus === "MARRIED" && "Casado/a"}
                      {patient.civilStatus === "DIVORCED" && "Divorciado/a"}
                      {patient.civilStatus === "WIDOWED" && "Viudo/a"}
                      {patient.civilStatus === "COHABITING" && "Unión de hecho"}
                      {!patient.civilStatus && "No especificado"}
                    </p>
                  )}
                </div>

                {/* Occupation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Profesión / Ocupación</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.occupation || ""}
                      onChange={(e) => handleInputChange("occupation", e.target.value)}
                      placeholder="Ocupación actual del paciente..."
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {patient.occupation || "No especificada"}
                    </p>
                  )}
                </div>

                {/* Education Level */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nivel de Estudios</label>
                  {isEditing ? (
                    <SearchableSelect
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'PRIMARY', label: 'Educación Primaria' },
                        { value: 'SECONDARY', label: 'Educación Secundaria / Bachillerato' },
                        { value: 'VOCATIONAL', label: 'Formación Profesional (FP)' },
                        { value: 'UNIVERSITY', label: 'Estudios Universitarios' },
                        { value: 'POSTGRADUATE', label: 'Postgrado / Máster / Doctorado' },
                      ]}
                      value={formData.educationLevel || ''}
                      onChange={(val) => handleInputChange("educationLevel", val)}
                      searchable={false}
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {patient.educationLevel === "PRIMARY" && "Educación Primaria"}
                      {patient.educationLevel === "SECONDARY" && "Educación Secundaria / Bachillerato"}
                      {patient.educationLevel === "VOCATIONAL" && "Formación Profesional (FP)"}
                      {patient.educationLevel === "UNIVERSITY" && "Estudios Universitarios"}
                      {patient.educationLevel === "POSTGRADUATE" && "Postgrado / Doctorado"}
                      {!patient.educationLevel && "No especificado"}
                    </p>
                  )}
                </div>

                {/* Housing Situation */}
                <div className="flex flex-col gap-1.5 md:col-span-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Situación de Vivienda y Convivencia</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.housingSituation || ""}
                      onChange={(e) => handleInputChange("housingSituation", e.target.value)}
                      placeholder="Ej. Vive solo en piso de alquiler, vive con su pareja e hijos, residencia compartida..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {patient.housingSituation || "No especificada"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Emergency Contact */}
            <div className="space-y-6 border-t border-gray-100 pt-6">
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                <PhoneCall size={18} className="text-blue-600" />
                Contacto de Emergencia
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nombre Completo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyContactName || ""}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="Nombre del familiar o contacto..."
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {patient.emergencyContactName || "No registrado"}
                    </p>
                  )}
                </div>

                {/* Contact Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono de Urgencias</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone || ""}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      placeholder="Teléfono móvil o fijo..."
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-medium">
                      {patient.emergencyContactPhone || "No registrado"}
                    </p>
                  )}
                </div>

                {/* Contact Relationship */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Relación / Parentesco</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyContactRelationship || ""}
                      onChange={(e) => handleInputChange("emergencyContactRelationship", e.target.value)}
                      placeholder="Ej. Cónyuge, Madre, Padre, Hermano, Tutor..."
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {patient.emergencyContactRelationship || "No registrada"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Administrative and Registration Info */}
            <div className="space-y-6 border-t border-gray-100 pt-6">
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                Ingreso y Datos de la Cuenta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Estado Clínico-Administrativo</label>
                  {isEditing ? (
                    <SearchableSelect
                      options={[
                        { value: 'ACTIVE', label: 'Activo' },
                        { value: 'DISCHARGED', label: 'De Alta' },
                        { value: 'ON_LEAVE', label: 'De Permiso' },
                        { value: 'WAITLIST', label: 'Lista de Espera' },
                      ]}
                      value={formData.status || 'ACTIVE'}
                      onChange={(val) => handleInputChange("status", val)}
                      searchable={false}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 font-semibold">
                      {patient.status === "ACTIVE" && "Activo"}
                      {patient.status === "DISCHARGED" && "De Alta"}
                      {patient.status === "ON_LEAVE" && "De Permiso"}
                      {patient.status === "WAITLIST" && "Lista de Espera"}
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Correo Electrónico</label>
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    {patient.email}
                  </p>
                </div>

                {/* Phone (Read-only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono Móvil</label>
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    {patient.phone || "No registrado"}
                  </p>
                </div>

                {/* Admission Date (Read-only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Fecha de Ingreso a Auren</label>
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    {patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString("es-ES") : "No registrado"}
                  </p>
                </div>

                {/* Discharge Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Fecha de Alta</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dischargeDate || ""}
                      onChange={(e) => handleInputChange("dischargeDate", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {patient.dischargeDate ? new Date(patient.dischargeDate).toLocaleDateString("es-ES") : "Activo en tratamiento"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Historial Clínico Tab ── */}
        {activeTab === "historial" && (
          <div className="space-y-8">

            {/* Citas */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-blue-600" />
                Citas y Visitas
              </h3>
              {patientAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Clock size={32} className="mb-2 text-gray-300" />
                  <p className="text-sm">Sin citas registradas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patientAppointments.map(appt => {
                    const statusColors: Record<string, string> = {
                      SCHEDULED: 'bg-blue-50 text-blue-700',
                      CONFIRMED: 'bg-indigo-50 text-indigo-700',
                      IN_PROGRESS: 'bg-amber-50 text-amber-700',
                      COMPLETED: 'bg-green-50 text-green-700',
                      CANCELLED: 'bg-gray-50 text-gray-500',
                      NO_SHOW: 'bg-red-50 text-red-700',
                    };
                    const statusLabels: Record<string, string> = {
                      SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'En Curso',
                      COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No Presentado',
                    };
                    const typeLabels: Record<string, string> = {
                      INDIVIDUAL: 'Individual', GROUP: 'Grupal', FAMILY: 'Familiar',
                      EMERGENCY: 'Urgencia', FOLLOW_UP: 'Seguimiento', INITIAL: 'Primera visita', TELEMATIC: 'Telemática',
                    };
                    return (
                      <div key={appt.id} className={`flex items-center gap-4 p-3 rounded-xl border ${
                        appt.status === 'CANCELLED' ? 'opacity-50 bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
                      }`}>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center text-blue-700 font-bold shrink-0">
                          <span className="text-[10px] uppercase tracking-wider">{format(new Date(appt.startTime), 'MMM', { locale: es })}</span>
                          <span className="text-base leading-none">{format(new Date(appt.startTime), 'dd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{typeLabels[appt.type] ?? appt.type}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(appt.startTime), "HH:mm")} — {appt.professionalName}
                          </p>
                          {appt.notes && <p className="text-xs text-gray-400 italic truncate mt-0.5">"{appt.notes}"</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColors[appt.status] ?? 'bg-gray-50 text-gray-500'}`}>
                          {statusLabels[appt.status] ?? appt.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Medicación Activa */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
                <Pill size={18} className="text-blue-600" />
                Medicación Activa
              </h3>
              {!activeTreatments || activeTreatments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Pill size={32} className="mb-2 text-gray-300" />
                  <p className="text-sm">Sin tratamientos activos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeTreatments.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Pill size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{t.medicationName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.medicationStrength && `${t.medicationStrength} · `}{t.scheduleName}
                        </p>
                        {t.prescribedByName && (
                          <p className="text-xs text-gray-400 mt-0.5">Prescrito por {t.prescribedByName}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500 shrink-0">
                        <p className="font-semibold">Desde {format(new Date(t.startDate), 'd MMM yyyy', { locale: es })}</p>
                        {t.endDate && <p>Hasta {format(new Date(t.endDate), 'd MMM yyyy', { locale: es })}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registros de Ánimo */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
                <Brain size={18} className="text-blue-600" />
                Registros de Estado de Ánimo (Últimos 10)
              </h3>
              {patientMoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <Brain size={32} className="mb-2 text-gray-300" />
                  <p className="text-sm">Sin registros de ánimo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patientMoods.map(mood => {
                    const moodColor = mood.moodScore >= 7 ? 'text-green-600' : mood.moodScore >= 4 ? 'text-amber-600' : 'text-red-600';
                    
                    // Calcular Índice de Bienestar (0-100)
                    let totalScore = mood.moodScore * 10;
                    let count = 1;
                    if (mood.anxietyScore !== null) {
                      totalScore += (11 - mood.anxietyScore) * 10; // Menor ansiedad es mejor
                      count++;
                    }
                    if (mood.energyScore !== null) {
                      totalScore += mood.energyScore * 10;
                      count++;
                    }
                    if (mood.sleepHours !== null) {
                      totalScore += Math.min((mood.sleepHours / 8) * 100, 100); // 8h o más es 100%
                      count++;
                    }
                    const wellnessScore = Math.round(totalScore / count);
                    const wellnessColor = wellnessScore >= 70 ? 'text-green-600' : wellnessScore >= 40 ? 'text-amber-600' : 'text-red-600';
                    const wellnessBg = wellnessScore >= 70 ? 'bg-green-50' : wellnessScore >= 40 ? 'bg-amber-50' : 'bg-red-50';

                    return (
                      <div key={mood.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100">
                        <div className={`w-16 h-14 rounded-xl ${wellnessBg} flex flex-col items-center justify-center shrink-0`}>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Índice</p>
                          <p className={`text-sm font-bold mt-0.5 ${wellnessColor}`}>{wellnessScore}%</p>
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ánimo</p>
                            <p className={`text-sm font-bold ${moodColor}`}>{mood.moodScore}/10</p>
                          </div>
                          {mood.anxietyScore !== null && (
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ansiedad</p>
                              <p className="text-sm font-bold text-orange-600">{mood.anxietyScore}/10</p>
                            </div>
                          )}
                          {mood.sleepHours !== null && (
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Sueño</p>
                              <p className="text-sm font-bold text-indigo-600">{mood.sleepHours}h</p>
                            </div>
                          )}
                          {mood.energyScore !== null && (
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Energía</p>
                              <p className="text-sm font-bold text-yellow-600">{mood.energyScore}/10</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">
                          {format(new Date(mood.createdAt), "d MMM HH:mm", { locale: es })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cuestionarios */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
                <ClipboardList size={18} className="text-blue-600" />
                Cuestionarios Completados
              </h3>
              {patientSurveyResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <ClipboardList size={32} className="mb-2 text-gray-300" />
                  <p className="text-sm">Sin cuestionarios completados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patientSurveyResponses.map(resp => (
                    <div key={resp.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100">
                      <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{resp.surveyTemplate?.name ?? 'Cuestionario'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(resp.completedAt), "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                      {resp.score !== null && (
                        <div className="text-center shrink-0">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Puntuación</p>
                          <p className="text-xl font-bold text-blue-700">{resp.score}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Evolución Tab ── */}
        {activeTab === "evolucion" && (
          <div className="h-full flex flex-col justify-center pb-8">
            <EvolutionChart patientId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
