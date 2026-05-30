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
    { id: 'catalog', label: 'Catálogo de Fármacos', icon: <Pill size={16} /> },
    { id: 'schedules', label: 'Pautas', icon: <Calendar size={16} /> },
    { id: 'treatments', label: 'Tratamientos Activos', icon: <Activity size={16} /> },
  ];

  return (
    <div className="space-y-2">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Gestiona los medicamentos, pautas predefinidas y tratamientos de los pacientes.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="pt-2">
        {activeTab === 'catalog' && <CatalogTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'treatments' && <TreatmentsTab />}
      </div>
    </div>
  );
}
