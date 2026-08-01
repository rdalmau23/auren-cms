"use client";

import React from "react";
import { Patient } from "@/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { User, PhoneCall, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

interface PersonalInfoTabProps {
  patient: Patient;
  formData: Partial<Patient>;
  isEditing: boolean;
  onInputChange: (field: keyof Patient, value: any) => void;
}

export function PersonalInfoTab({ patient, formData, isEditing, onInputChange }: PersonalInfoTabProps) {
  const t = useTranslations("patients.personalInfo");
  const tStatus = useTranslations("patients.status");
  const tReason = useTranslations("patients.inactivityReason");
  return (
    <div className="space-y-8">
      {/* Section 1: Demographics */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
          <User size={18} className="text-blue-600" />
          {t("title")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DNI */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">DNI / NIF</label>
            {isEditing ? (
              <input type="text" value={formData.dni || ""} onChange={(e) => onInputChange("dni", e.target.value)} placeholder={t("dniPlaceholder")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900" />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{patient.dni || t("notSpecified")}</p>
            )}
          </div>

          {/* NHC */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("nhc")}</label>
            {isEditing ? (
              <input type="text" value={formData.nhc || ""} onChange={(e) => onInputChange("nhc", e.target.value)} placeholder={t("nhcPlaceholder")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900" />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{patient.nhc || t("notSpecified")}</p>
            )}
          </div>

          {/* Birth Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("birthDate")}</label>
            {isEditing ? (
              <input type="date" value={formData.birthDate || ""} onChange={(e) => onInputChange("birthDate", e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900" />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString("es-ES") : t("notSpecified")}</p>
            )}
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("gender")}</label>
            {isEditing ? (
              <SearchableSelect
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'MALE', label: 'Masculino' },
                  { value: 'FEMALE', label: 'Femenino' },
                  { value: 'OTHER', label: 'Otro / No binario' },
                ]}
                value={formData.gender || ''}
                onChange={(val) => onInputChange("gender", val)}
                searchable={false}
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">
                {patient.gender === "MALE" && t("genderMale")}
                {patient.gender === "FEMALE" && t("genderFemale")}
                {patient.gender === "OTHER" && t("genderOther")}
                {!patient.gender && t("notSpecified")}
              </p>
            )}
          </div>

          {/* Blood Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("bloodType")}</label>
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
                onChange={(val) => onInputChange("bloodType", val)}
                searchable={false}
              />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{patient.bloodType || t("bloodNotDeclared")}</p>
            )}
          </div>

          {/* Civil Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("civilStatus")}</label>
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
                onChange={(val) => onInputChange("civilStatus", val)}
                searchable={false}
              />
            ) : (
              <p className="text-sm text-gray-800">
                {patient.civilStatus === "SINGLE" && t("civilSingle")}
                {patient.civilStatus === "MARRIED" && t("civilMarried")}
                {patient.civilStatus === "DIVORCED" && t("civilDivorced")}
                {patient.civilStatus === "WIDOWED" && t("civilWidowed")}
                {patient.civilStatus === "COHABITING" && t("civilCohabiting")}
                {!patient.civilStatus && t("notSpecified")}
              </p>
            )}
          </div>

          {/* Occupation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("occupation")}</label>
            {isEditing ? (
              <input type="text" value={formData.occupation || ""} onChange={(e) => onInputChange("occupation", e.target.value)} placeholder={t("occupationPlaceholder")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
              <p className="text-sm text-gray-800">{patient.occupation || t("notSpecified")}</p>
            )}
          </div>

          {/* Education Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("educationLevel")}</label>
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
                onChange={(val) => onInputChange("educationLevel", val)}
                searchable={false}
              />
            ) : (
              <p className="text-sm text-gray-800">
                {patient.educationLevel === "PRIMARY" && t("eduPrimary")}
                {patient.educationLevel === "SECONDARY" && t("eduSecondary")}
                {patient.educationLevel === "VOCATIONAL" && t("eduVocational")}
                {patient.educationLevel === "UNIVERSITY" && t("eduUniversity")}
                {patient.educationLevel === "POSTGRADUATE" && t("eduPostgraduateShort")}
                {!patient.educationLevel && t("notSpecified")}
              </p>
            )}
          </div>

          {/* Housing Situation */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("housing")}</label>
            {isEditing ? (
              <input type="text" value={formData.housingSituation || ""} onChange={(e) => onInputChange("housingSituation", e.target.value)} placeholder={t("housingPlaceholder")} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
              <p className="text-sm text-gray-800">{patient.housingSituation || t("notSpecified")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Emergency Contact */}
      <div className="space-y-6 border-t border-gray-100 pt-6">
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
          <PhoneCall size={18} className="text-blue-600" />
          {t("emergencyTitle")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("fullName")}</label>
            {isEditing ? (
              <input type="text" value={formData.emergencyContactName || ""} onChange={(e) => onInputChange("emergencyContactName", e.target.value)} placeholder={t("emergencyNamePlaceholder")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{patient.emergencyContactName || t("notRegistered")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("emergencyPhone")}</label>
            {isEditing ? (
              <input type="tel" value={formData.emergencyContactPhone || ""} onChange={(e) => onInputChange("emergencyContactPhone", e.target.value)} placeholder={t("emergencyPhonePlaceholder")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
              <p className="text-sm text-gray-800 font-medium">{patient.emergencyContactPhone || t("notRegistered")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("relationship")}</label>
            {isEditing ? (
              <input type="text" value={formData.emergencyContactRelationship || ""} onChange={(e) => onInputChange("emergencyContactRelationship", e.target.value)} placeholder={t("relationshipPlaceholder")} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
              <p className="text-sm text-gray-800">{patient.emergencyContactRelationship || t("notRegistered")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Administrative */}
      <div className="space-y-6 border-t border-gray-100 pt-6">
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
          <UserPlus size={18} className="text-blue-600" />
          {t("adminTitle")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("adminStatus")}</label>
            {isEditing ? (
              <SearchableSelect
                options={[
                  { value: 'ACTIVE', label: tStatus('ACTIVE') },
                  { value: 'DISCHARGED', label: tStatus('DISCHARGED') },
                  { value: 'ON_LEAVE', label: tStatus('ON_LEAVE') },
                  { value: 'WAITLIST', label: tStatus('WAITLIST') },
                ]}
                value={formData.status || 'ACTIVE'}
                onChange={(val) => {
                  onInputChange("status", val);
                  if (val === 'ACTIVE' || val === 'WAITLIST') {
                    onInputChange("inactivityReason", null);
                  }
                }}
                searchable={false}
              />
            ) : (
              <p className="text-sm text-gray-800 font-semibold">
                {patient.status === "ACTIVE" && tStatus("ACTIVE")}
                {patient.status === "DISCHARGED" && tStatus("DISCHARGED")}
                {patient.status === "ON_LEAVE" && tStatus("ON_LEAVE")}
                {patient.status === "WAITLIST" && tStatus("WAITLIST")}
              </p>
            )}
          </div>

          {/* Inactivity Reason */}
          {(formData.status === 'DISCHARGED' || formData.status === 'ON_LEAVE' || patient.status === 'DISCHARGED' || patient.status === 'ON_LEAVE') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">{t("inactivityReasonTitle")}</label>
              {isEditing ? (
                <SearchableSelect
                  options={[
                    { value: 'VOLUNTARY_DROPOUT', label: tReason('VOLUNTARY_DROPOUT') },
                    { value: 'MEDICAL_INABILITY', label: tReason('MEDICAL_INABILITY') },
                    { value: 'DECEASED', label: tReason('DECEASED') },
                    { value: 'LOST_TO_FOLLOWUP', label: tReason('LOST_TO_FOLLOWUP') },
                    { value: 'PROTOCOL_VIOLATION', label: tReason('PROTOCOL_VIOLATION') },
                    { value: 'OTHER', label: tReason('OTHER') },
                  ]}
                  value={formData.inactivityReason || ''}
                  onChange={(val) => onInputChange("inactivityReason", val)}
                  searchable={false}
                />
              ) : (
                <p className="text-sm text-gray-800 font-semibold">
                  {patient.inactivityReason === "VOLUNTARY_DROPOUT" && tReason("VOLUNTARY_DROPOUT")}
                  {patient.inactivityReason === "MEDICAL_INABILITY" && tReason("MEDICAL_INABILITY")}
                  {patient.inactivityReason === "DECEASED" && tReason("DECEASED")}
                  {patient.inactivityReason === "LOST_TO_FOLLOWUP" && tReason("LOST_TO_FOLLOWUP")}
                  {patient.inactivityReason === "PROTOCOL_VIOLATION" && tReason("PROTOCOL_VIOLATION")}
                  {patient.inactivityReason === "OTHER" && tReason("OTHER")}
                  {!patient.inactivityReason && t("notSpecified")}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("emailTitle")}</label>
            {isEditing ? (
              <input type="email" value={formData.email || ""} onChange={(e) => onInputChange("email", e.target.value)} placeholder={t("emailPlaceholder")} className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 font-semibold" />
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 font-semibold">{patient.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("phoneTitle")}</label>
            {isEditing ? (
              <input type="text" value={formData.phone || ""} onChange={(e) => onInputChange("phone", e.target.value)} placeholder={t("phonePlaceholder")} className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 font-semibold" />
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 font-semibold">{patient.phone || t("notRegistered")}</p>
            )}
          </div>

          {/* Admission Date (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("admissionDateTitle")}</label>
            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              {patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString("es-ES") : t("notRegistered")}
            </p>
          </div>

          {/* Discharge Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t("dischargeDateTitle")}</label>
            {isEditing ? (
              <input type="date" value={formData.dischargeDate || ""} onChange={(e) => onInputChange("dischargeDate", e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
              <p className="text-sm text-gray-800">
                {patient.dischargeDate ? new Date(patient.dischargeDate).toLocaleDateString("es-ES") : t("activeInTreatment")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
