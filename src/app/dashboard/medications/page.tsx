"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui/Tabs';
import { CatalogTab } from './components/CatalogTab';
import { SchedulesTab } from './components/SchedulesTab';
import { TreatmentsTab } from './components/TreatmentsTab';
import { Pill, Calendar, Activity } from 'lucide-react';

export default function MedicationsPage() {
  const t = useTranslations('medications');
  const [activeTab, setActiveTab] = useState('catalog');

  const tabs = [
    { id: 'catalog', label: t('catalogTab'), icon: <Pill size={16} /> },
    { id: 'schedules', label: t('schedulesTab'), icon: <Calendar size={16} /> },
    { id: 'treatments', label: t('treatmentsTab'), icon: <Activity size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      <div className="shrink-0">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pt-2">
        {activeTab === 'catalog' && <CatalogTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'treatments' && <TreatmentsTab />}
      </div>
    </div>
  );
}
