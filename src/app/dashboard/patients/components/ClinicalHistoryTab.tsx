"use client";

import React from "react";
import { Appointment, Treatment, DailyMood, SurveyResponse, PageResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Calendar, Pill, Brain, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { es } from "date-fns/locale";

interface ClinicalHistoryTabProps {
  patientId: string;
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  CONFIRMED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-gray-50 text-gray-500',
  NO_SHOW: 'bg-red-50 text-red-700',
};





function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<any>; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
      <Icon size={32} className="mb-2 text-gray-300" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function computeWellnessScore(mood: DailyMood) {
  let totalScore = mood.moodScore * 10;
  let count = 1;
  if (mood.anxietyScore !== null) { totalScore += (11 - mood.anxietyScore) * 10; count++; }
  if (mood.energyScore !== null) { totalScore += mood.energyScore * 10; count++; }
  if (mood.sleepHours !== null) { totalScore += Math.min((mood.sleepHours / 8) * 100, 100); count++; }
  return Math.round(totalScore / count);
}

export function ClinicalHistoryTab({ patientId }: ClinicalHistoryTabProps) {
  const t = useTranslations("patients.clinicalHistory");

  const { data: appointmentsPage } = useQuery<PageResponse<Appointment>>({
    queryKey: ['patient-appointments', patientId],
    queryFn: () => api.get<PageResponse<Appointment>>(`/v1/appointments/patient/${patientId}?size=20&sort=startTime,desc`),
    enabled: !!patientId,
  });

  const { data: activeTreatments } = useQuery<Treatment[]>({
    queryKey: ['patient-treatments-active', patientId],
    queryFn: () => api.get<Treatment[]>(`/v1/medications/treatments/patient/${patientId}/active`),
    enabled: !!patientId,
  });

  const { data: patientMoodsData } = useQuery<DailyMood[]>({
    queryKey: ['patient-moods', patientId],
    queryFn: () => api.get<DailyMood[]>(`/v1/moods/patient/${patientId}?size=10`),
    enabled: !!patientId,
  });

  const { data: surveyResponsesPage } = useQuery<PageResponse<SurveyResponse>>({
    queryKey: ['patient-survey-responses', patientId],
    queryFn: () => api.get<PageResponse<SurveyResponse>>(`/v1/surveys/responses/patient/${patientId}?size=10`),
    enabled: !!patientId,
  });

  const appointments = appointmentsPage?.content ?? [];
  const moods = patientMoodsData ?? [];
  const surveyResponses = surveyResponsesPage?.content ?? [];

  return (
    <div className="space-y-8">
      {/* Citas */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-blue-600" />
          {t("appointments")}
        </h3>
        {appointments.length === 0 ? (
          <EmptyState icon={Clock} message={t("appointmentsEmpty")} />
        ) : (
          <div className="space-y-2">
            {appointments.map(appt => (
              <div key={appt.id} className={`flex items-center gap-4 p-3 rounded-xl border ${
                appt.status === 'CANCELLED' ? 'opacity-50 bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
              }`}>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center text-blue-700 font-bold shrink-0">
                  <span className="text-[10px] uppercase tracking-wider">{format(new Date(appt.startTime), 'MMM', { locale: es })}</span>
                  <span className="text-base leading-none">{format(new Date(appt.startTime), 'dd')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t(`appointmentType.${appt.type}` as any) ?? appt.type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{format(new Date(appt.startTime), "HH:mm")} — {appt.professionalName}</p>
                  {appt.notes && <p className="text-xs text-gray-400 italic truncate mt-0.5">&quot;{appt.notes}&quot;</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColors[appt.status] ?? 'bg-gray-50 text-gray-500'}`}>
                  {t(`appointmentStatus.${appt.status}` as any) ?? appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* {t("medications")} */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
          <Pill size={18} className="text-blue-600" />
          Medicación Activa
        </h3>
        {!activeTreatments || activeTreatments.length === 0 ? (
          <EmptyState icon={Pill} message={t("medicationsEmpty")} />
        ) : (
          <div className="space-y-2">
            {activeTreatments.map(treatment => (
              <div key={treatment.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Pill size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{treatment.medicationName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {treatment.medicationStrength && `${treatment.medicationStrength} · `}{treatment.scheduleName}
                  </p>
                  {treatment.prescribedByName && <p className="text-xs text-gray-400 mt-0.5">{t("prescribedBy")} {treatment.prescribedByName}</p>}
                </div>
                <div className="text-right text-xs text-gray-500 shrink-0">
                  <p className="font-semibold">{t("from")} {format(new Date(treatment.startDate), 'd MMM yyyy', { locale: es })}</p>
                  {treatment.endDate && <p>{t("to")} {format(new Date(treatment.endDate), 'd MMM yyyy', { locale: es })}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registros de {t("mood")} */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2 mb-4">
          <Brain size={18} className="text-blue-600" />
          {t("moods")}
        </h3>
        {moods.length === 0 ? (
          <EmptyState icon={Brain} message={t("moodsEmpty")} />
        ) : (
          <div className="space-y-2">
            {moods.map(mood => {
              const wellnessScore = computeWellnessScore(mood);
              const moodColor = mood.moodScore >= 7 ? 'text-green-600' : mood.moodScore >= 4 ? 'text-amber-600' : 'text-red-600';
              const wellnessColor = wellnessScore >= 70 ? 'text-green-600' : wellnessScore >= 40 ? 'text-amber-600' : 'text-red-600';
              const wellnessBg = wellnessScore >= 70 ? 'bg-green-50' : wellnessScore >= 40 ? 'bg-amber-50' : 'bg-red-50';

              return (
                <div key={mood.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100">
                  <div className={`w-16 h-14 rounded-xl ${wellnessBg} flex flex-col items-center justify-center shrink-0`}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t("index")}</p>
                    <p className={`text-sm font-bold mt-0.5 ${wellnessColor}`}>{wellnessScore}%</p>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ánimo</p>
                      <p className={`text-sm font-bold ${moodColor}`}>{mood.moodScore}/10</p>
                    </div>
                    {mood.anxietyScore !== null && (
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("anxiety")}</p>
                        <p className="text-sm font-bold text-orange-600">{mood.anxietyScore}/10</p>
                      </div>
                    )}
                    {mood.sleepHours !== null && (
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("sleep")}</p>
                        <p className="text-sm font-bold text-indigo-600">{mood.sleepHours}h</p>
                      </div>
                    )}
                    {mood.energyScore !== null && (
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("energy")}</p>
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
          {t("surveys")}
        </h3>
        {surveyResponses.length === 0 ? (
          <EmptyState icon={ClipboardList} message={t("surveysEmpty")} />
        ) : (
          <div className="space-y-2">
            {surveyResponses.map(resp => (
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
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t("score")}</p>
                    <p className="text-xl font-bold text-blue-700">{resp.score}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
