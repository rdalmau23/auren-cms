"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DailyMood } from '@/types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subMonths, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Activity } from 'lucide-react';

interface EvolutionChartProps {
  patientId: string;
}

type RangeOption = 1 | 3 | 6 | 12;

export function EvolutionChart({ patientId }: EvolutionChartProps) {
  const [monthsRange, setMonthsRange] = useState<RangeOption>(1);

  // Calculate dates based on range
  const { start, end } = useMemo(() => {
    const today = new Date();
    const startDate = startOfDay(subMonths(today, monthsRange));
    const endDate = endOfDay(today);
    
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }, [monthsRange]);

  // Fetch evolution data
  const { data: moods, isLoading, error } = useQuery<DailyMood[]>({
    queryKey: ['patient-evolution', patientId, start, end],
    queryFn: () => api.get<DailyMood[]>(`/v1/moods/patient/${patientId}/range?start=${start}&end=${end}`),
    enabled: !!patientId,
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!moods) return [];
    
    // Sort ascending by date for the chart
    const sorted = [...moods].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return sorted.map(mood => ({
      date: format(new Date(mood.createdAt), 'dd MMM', { locale: es }),
      fullDate: format(new Date(mood.createdAt), 'dd MMMM yyyy', { locale: es }),
      Animo: mood.moodScore,
      Ansiedad: mood.anxietyScore,
      Sueno: mood.sleepHours,
    }));
  }, [moods]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">Analizando evolución clínica...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-red-50 rounded-2xl border border-red-100 text-red-600">
        <Activity size={32} className="mb-2" />
        <p className="text-sm font-semibold">Error al cargar la evolución</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            Evolución Clínica
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Tendencia del estado de ánimo, ansiedad y horas de sueño.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          {[
            { value: 1, label: '1 Mes' },
            { value: 3, label: '3 Meses' },
            { value: 6, label: '6 Meses' },
            { value: 12, label: '1 Año' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setMonthsRange(opt.value as RangeOption)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                monthsRange === opt.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <Calendar size={32} className="mb-2 text-gray-300" />
          <p className="text-sm">No hay suficientes registros en este periodo.</p>
        </div>
      ) : (
        <div className="h-70 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                domain={[0, 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                name="Estado de Ánimo"
                dataKey="Animo" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                name="Ansiedad"
                dataKey="Ansiedad" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                name="Horas de Sueño"
                dataKey="Sueno" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
