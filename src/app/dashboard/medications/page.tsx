"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { Medication } from '@/types';
import { Button } from '@/components/ui';

export default function MedicationsPage() {
  const t = useTranslations('medications');
  const tCommon = useTranslations('common');

  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: () => api.get<Medication[]>('/v1/medications'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <Button variant="primary">Nuevo fármaco</Button>
      </div>

      {isLoading ? (
        <div className="text-neutral-500">{tCommon('loading')}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{tCommon('name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Principio activo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Forma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Dosis</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {medications?.map((med) => (
                <tr key={med.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{med.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{med.activeSubstance || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{t(`form.${med.form.toLowerCase()}` as any)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{med.strength || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
