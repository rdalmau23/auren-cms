"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { Treatment } from '@/types';
import { Button } from '@/components/ui';

export default function TreatmentsPage() {
  const t = useTranslations('medications');
  const tCommon = useTranslations('common');

  // Currently fetching active treatments for all (or a specific list in a real app, 
  // here we might just have a generalized search or require a patientId context).
  // For demonstration, let's just assume we want to show a UI where you pick a patient first,
  // but we can mock a list of all active treatments for the center here if the endpoint supported it.
  // We'll leave it as a placeholder list requiring patient selection in the actual app.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t('treatments')}</h1>
        <Button variant="default" className="gap-2">{t('newTreatment')}</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center text-neutral-500">
        <p>Para ver los tratamientos, por favor seleccione un paciente desde la ficha del paciente.</p>
        {/* In the real app, this page might have a PatientCombobox to search for a patient and fetch their treatments. */}
      </div>
    </div>
  );
}
