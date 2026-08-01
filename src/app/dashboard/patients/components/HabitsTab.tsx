"use client";

import React from "react";
import { Patient } from "@/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Cigarette, Beer, Dumbbell } from "lucide-react";
import { useTranslations } from "next-intl";

interface HabitsTabProps {
  patient: Patient;
  formData: Partial<Patient>;
  isEditing: boolean;
  onInputChange: (field: keyof Patient, value: any) => void;
}

export function HabitsTab({ patient, formData, isEditing, onInputChange }: HabitsTabProps) {
  const t = useTranslations("patients.habits");

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
        <Cigarette size={18} className="text-blue-600" />
        {t("title")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Is Smoker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase">{t("isSmoker")}</label>
          {isEditing ? (
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" checked={formData.isSmoker === true} onChange={() => onInputChange("isSmoker", true)} className="text-blue-600 focus:ring-blue-500" />
                {t("smokerYes")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" checked={formData.isSmoker === false} onChange={() => onInputChange("isSmoker", false)} className="text-blue-600 focus:ring-blue-500" />
                {t("smokerNo")}
              </label>
            </div>
          ) : (
            <p className="text-sm text-gray-800 font-medium">
              {patient.isSmoker ? t("smokerActive") : t("smokerNone")}
            </p>
          )}
        </div>

        {/* Alcohol Consumption */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase">{t("alcohol")}</label>
          {isEditing ? (
            <SearchableSelect
              options={[
                { value: 'NONE', label: t("alcoholNoneOption") },
                { value: 'OCCASIONAL', label: t("alcoholOccasionalOption") },
                { value: 'FREQUENT', label: t("alcoholFrequentOption") },
              ]}
              value={formData.alcoholConsumption || 'NONE'}
              onChange={(val) => onInputChange("alcoholConsumption", val)}
              searchable={false}
            />
          ) : (
            <p className="text-sm text-gray-800 font-medium flex items-center gap-1.5">
              <Beer size={16} className="text-amber-500" />
              {patient.alcoholConsumption === "NONE" && t("alcoholNone")}
              {patient.alcoholConsumption === "OCCASIONAL" && t("alcoholOccasional")}
              {patient.alcoholConsumption === "FREQUENT" && t("alcoholFrequent")}
            </p>
          )}
        </div>

        {/* Sports Activity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase">{t("sports")}</label>
          {isEditing ? (
            <SearchableSelect
              options={[
                { value: 'NONE', label: t("sportsNoneOption") },
                { value: 'OCCASIONAL', label: t("sportsOccasionalOption") },
                { value: 'REGULAR', label: t("sportsRegularOption") },
              ]}
              value={formData.sportsActivity || 'NONE'}
              onChange={(val) => onInputChange("sportsActivity", val)}
              searchable={false}
            />
          ) : (
            <p className="text-sm text-gray-800 font-medium flex items-center gap-1.5">
              <Dumbbell size={16} className="text-blue-500" />
              {patient.sportsActivity === "NONE" && t("sportsNone")}
              {patient.sportsActivity === "OCCASIONAL" && t("sportsOccasional")}
              {patient.sportsActivity === "REGULAR" && t("sportsRegular")}
            </p>
          )}
        </div>

        {/* Substance Use */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase">{t("substances")}</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.substanceUse || ""}
              onChange={(e) => onInputChange("substanceUse", e.target.value)}
              placeholder={t("substancesPlaceholder")}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-sm text-gray-800 font-medium">
              {patient.substanceUse || t("substancesNone")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
