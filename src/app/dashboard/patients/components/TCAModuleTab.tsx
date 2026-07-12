import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TCAMealLogResponse, TCAWeightLogResponse } from '@/types';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Apple, Scale, Clock } from 'lucide-react';

interface TCAModuleTabProps {
  patientId: string;
}

export function TCAModuleTab({ patientId }: TCAModuleTabProps) {
  const t = useTranslations('tca');

  const { data: mealLogs = [], isLoading: isLoadingMeals } = useQuery<TCAMealLogResponse[]>({
    queryKey: ['tca-meals', patientId],
    queryFn: () => api.get<TCAMealLogResponse[]>(`/v1/tca/meals/patient/${patientId}`),
  });

  const { data: weightLogs = [], isLoading: isLoadingWeights } = useQuery<TCAWeightLogResponse[]>({
    queryKey: ['tca-weights', patientId],
    queryFn: () => api.get<TCAWeightLogResponse[]>(`/v1/tca/weights/patient/${patientId}`),
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: es });
  };

  const getMealTypeLabel = (type: string) => {
    switch(type) {
      case 'BREAKFAST': return t('mealType.breakfast');
      case 'LUNCH': return t('mealType.lunch');
      case 'DINNER': return t('mealType.dinner');
      case 'SNACK': return t('mealType.snack');
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-500">Monitorización de peso y registro de ingestas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weight Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Scale size={16} className="text-emerald-500" />
              {t('weightLog')}
            </h3>
            <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
              {weightLogs.length} registros
            </span>
          </div>
          
          <div className="p-4">
            {isLoadingWeights ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : weightLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay registros de peso disponibles.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {weightLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{log.weight}</span>
                        <span className="text-sm font-semibold text-gray-500">kg</span>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-600 mt-2">{log.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                      <Clock size={12} />
                      {formatDate(log.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meal Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Apple size={16} className="text-orange-500" />
              {t('mealLog')}
            </h3>
            <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
              {mealLogs.length} registros
            </span>
          </div>

          <div className="p-4">
            {isLoadingMeals ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : mealLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay registros de ingestas disponibles.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mealLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          {getMealTypeLabel(log.mealType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                        <Clock size={12} />
                        {formatDate(log.date)}
                      </div>
                    </div>
                    
                    {log.foodDescription && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('foodDescription')}</span>
                        <p className="text-sm text-gray-800 mt-1">{log.foodDescription}</p>
                      </div>
                    )}
                    
                    {log.emotions && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('emotions')}</span>
                        <p className="text-sm text-gray-800 mt-1">{log.emotions}</p>
                      </div>
                    )}

                    {(log.bingeUrge || log.purgeUrge) && (
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        {log.bingeUrge && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                            🚨 {t('bingeUrge')}
                          </span>
                        )}
                        {log.purgeUrge && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                            🚨 {t('purgeUrge')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
