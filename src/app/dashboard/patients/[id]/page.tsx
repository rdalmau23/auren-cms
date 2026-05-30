"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Patient } from "@/types";
import { 
  ChevronLeft, Edit2, Check, X, Shield, Activity, 
  User, Heart, Cigarette, Beer, HelpCircle, Dumbbell, AlertTriangle,
  Flame, ShieldAlert, PhoneCall, UserPlus
} from "lucide-react";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"clinical" | "habits" | "general">("clinical");

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
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            <select
              value={formData.riskLevel}
              onChange={(e) => handleInputChange("riskLevel", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="LOW">Bajo</option>
              <option value="MODERATE">Moderado</option>
              <option value="HIGH">Alto</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
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
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                  <select
                    value={formData.alcoholConsumption}
                    onChange={(e) => handleInputChange("alcoholConsumption", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="NONE">Ninguno / Abstemio</option>
                    <option value="OCCASIONAL">Ocasional / Social</option>
                    <option value="FREQUENT">Frecuente / Abuso</option>
                  </select>
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
                  <select
                    value={formData.sportsActivity}
                    onChange={(e) => handleInputChange("sportsActivity", e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="NONE">Sedentario / Ninguno</option>
                    <option value="OCCASIONAL">Actividad física ocasional</option>
                    <option value="REGULAR">Regular / Deportista</option>
                  </select>
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
                    <select
                      value={formData.gender || ""}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Femenino</option>
                      <option value="OTHER">Otro / No binario</option>
                    </select>
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
                    <select
                      value={formData.bloodType || ""}
                      onChange={(e) => handleInputChange("bloodType", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Desconocido...</option>
                      <option value="A+">A positivo (A+)</option>
                      <option value="A-">A negativo (A-)</option>
                      <option value="B+">B positivo (B+)</option>
                      <option value="B-">B negativo (B-)</option>
                      <option value="AB+">AB positivo (AB+)</option>
                      <option value="AB-">AB negativo (AB-)</option>
                      <option value="O+">O positivo (O+)</option>
                      <option value="O-">O negativo (O-)</option>
                    </select>
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
                    <select
                      value={formData.civilStatus || ""}
                      onChange={(e) => handleInputChange("civilStatus", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="SINGLE">Soltero/a</option>
                      <option value="MARRIED">Casado/a</option>
                      <option value="DIVORCED">Divorciado/a</option>
                      <option value="WIDOWED">Viudo/a</option>
                      <option value="COHABITING">Unión de hecho</option>
                    </select>
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
                    <select
                      value={formData.educationLevel || ""}
                      onChange={(e) => handleInputChange("educationLevel", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="PRIMARY">Educación Primaria</option>
                      <option value="SECONDARY">Educación Secundaria / Bachillerato</option>
                      <option value="VOCATIONAL">Formación Profesional (FP)</option>
                      <option value="UNIVERSITY">Estudios Universitarios</option>
                      <option value="POSTGRADUATE">Postgrado / Máster / Doctorado</option>
                    </select>
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
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="DISCHARGED">De Alta</option>
                      <option value="ON_LEAVE">De Permiso</option>
                      <option value="WAITLIST">Lista de Espera</option>
                    </select>
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
      </div>
    </div>
  );
}
