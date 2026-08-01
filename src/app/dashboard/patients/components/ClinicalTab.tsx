"use client";

import React from "react";
import { Patient, Pathology } from "@/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { MultiSelect } from "@/components/ui/MultiSelect";
import {
  Shield, Heart, HelpCircle, AlertTriangle, Flame, ShieldAlert, Brain,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ClinicalTabProps {
  patient: Patient;
  formData: Partial<Patient & { pathologyIds?: string[] }>;
  isEditing: boolean;
  pathologies: Pathology[];
  onInputChange: (field: keyof Patient, value: any) => void;
  onFormDataChange: (updater: (prev: any) => any) => void;
}

export function ClinicalTab({ patient, formData, isEditing, pathologies, onInputChange, onFormDataChange }: ClinicalTabProps) {
  const t = useTranslations("patients.clinical");

  const tPathologies = useTranslations("pathologies");

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
        <Shield size={18} className="text-blue-600" />
        {t("title")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diagnosis */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">{t("diagnosis")}</label>
          {isEditing ? (
            <textarea
              value={formData.diagnosis || ""}
              onChange={(e) => onInputChange("diagnosis", e.target.value)}
              rows={3}
              placeholder={t("diagnosisPlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[48px]">
              {patient.diagnosis || t("notSpecified")}
            </p>
          )}
        </div>

        {/* Pathologies */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Brain size={14} className="text-blue-500" />
            {tPathologies("title")}
          </label>
          {isEditing ? (
            <MultiSelect
              options={pathologies.map((pathology) => ({
                value: pathology.id,
                label: pathology.name,
                sublabel: pathology.description || undefined,
                avatarInitials: pathology.code,
              }))}
              values={formData.pathologyIds || []}
              onChange={(values) => onFormDataChange((prev: any) => ({ ...prev, pathologyIds: values }))}
              placeholder={tPathologies("select")}
              emptyMessage={t("pathologiesEmpty")}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.pathologies && patient.pathologies.length > 0 ? (
                patient.pathologies.map(p => (
                  <span key={p.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {p.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t("pathologiesNone")}</p>
              )}
            </div>
          )}
        </div>

        {/* Physical Illnesses */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Heart size={14} className="text-red-500" />
            {t("physicalIllnesses")}
          </label>
          {isEditing ? (
            <textarea
              value={formData.physicalIllnesses || ""}
              onChange={(e) => onInputChange("physicalIllnesses", e.target.value)}
              rows={3}
              placeholder={t("physicalIllnessesPlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[80px] whitespace-pre-line">
              {patient.physicalIllnesses || t("physicalIllnessesNone")}
            </p>
          )}
        </div>

        {/* Allergies */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <ShieldAlert size={14} className="text-amber-500" />
            {t("allergies")}
          </label>
          {isEditing ? (
            <textarea
              value={formData.allergies || ""}
              onChange={(e) => onInputChange("allergies", e.target.value)}
              rows={3}
              placeholder={t("allergiesPlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[80px] whitespace-pre-line">
              {patient.allergies || t("allergiesNone")}
            </p>
          )}
        </div>

        {/* Family Problems */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <HelpCircle size={14} className="text-purple-500" />
            {t("familyProblems")}
          </label>
          {isEditing ? (
            <textarea
              value={formData.familyProblems || ""}
              onChange={(e) => onInputChange("familyProblems", e.target.value)}
              rows={4}
              placeholder={t("familyProblemsPlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[100px] whitespace-pre-line">
              {patient.familyProblems || t("familyProblemsNone")}
            </p>
          )}
        </div>

        {/* Relapses History */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <AlertTriangle size={14} className="text-amber-500" />
            {t("relapses")}
          </label>
          {isEditing ? (
            <textarea
              value={formData.relapsesHistory || ""}
              onChange={(e) => onInputChange("relapsesHistory", e.target.value)}
              rows={4}
              placeholder={t("relapsesPlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[100px] whitespace-pre-line">
              {patient.relapsesHistory || t("relapsesNone")}
            </p>
          )}
        </div>

        {/* Prior Admissions */}
        <div className="flex flex-col gap-6 md:col-span-2 border-t border-gray-100 pt-6">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Flame size={16} className="text-red-500" />
            {t("admissionsTitle")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">{t("hasPriorAdmissions")}</label>
              {isEditing ? (
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" checked={formData.hasPriorAdmissions === true} onChange={() => onInputChange("hasPriorAdmissions", true)} className="text-blue-600 focus:ring-blue-500" />
                    {t("admissionsYes")}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" checked={formData.hasPriorAdmissions === false} onChange={() => { onInputChange("hasPriorAdmissions", false); onInputChange("priorAdmissionsCount", 0); }} className="text-blue-600 focus:ring-blue-500" />
                    {t("admissionsNone")}
                  </label>
                </div>
              ) : (
                <p className="text-sm text-gray-800 font-medium">
                  {patient.hasPriorAdmissions ? t("admissionsYesText") : t("admissionsNoneText")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">{t("admissionsCount")}</label>
              {isEditing ? (
                <input type="number" min="0" disabled={!formData.hasPriorAdmissions} value={formData.priorAdmissionsCount ?? 0} onChange={(e) => onInputChange("priorAdmissionsCount", parseInt(e.target.value) || 0)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50" />
              ) : (
                <p className="text-sm text-gray-800">
                  {patient.hasPriorAdmissions ? `${patient.priorAdmissionsCount} ${t("admissionsCountLabel")}` : "0"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-3">
              <label className="text-xs font-semibold text-gray-500 uppercase">{t("lastAdmissionReason")}</label>
              {isEditing ? (
                <textarea disabled={!formData.hasPriorAdmissions} value={formData.lastAdmissionReason || ""} onChange={(e) => onInputChange("lastAdmissionReason", e.target.value)} rows={2} placeholder={t("lastAdmissionReasonPlaceholder")} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50" />
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
  );
}
