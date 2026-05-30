"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { MedicationSchedule } from '@/types';
import { Button } from '@/components/ui';

export default function SchedulesPage() {
  const t = useTranslations('medications');
  const tCommon = useTranslations('common');

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.get<MedicationSchedule[]>('/v1/medications/schedules'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t('schedules')}</h1>
        <Button variant="primary">{t('newSchedule')}</Button>
      </div>

      {isLoading ? (
        <div className="text-neutral-500">{tCommon('loading')}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules?.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg text-neutral-900">{schedule.name}</h3>
              <p className="text-sm text-neutral-500 mb-4">{schedule.medicationName} {schedule.medicationStrength}</p>
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-500 uppercase">{t('slots')}</h4>
                <ul className="space-y-1">
                  {schedule.slots.map((slot) => (
                    <li key={slot.id} className="text-sm text-neutral-700 bg-neutral-50 px-2 py-1 rounded">
                      {slot.time} - {slot.quantity} {t(`unit_type.${slot.unit.toLowerCase()}` as any)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
