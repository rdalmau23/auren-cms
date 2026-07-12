"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/analytics-client";
import { AnalyticsSummary, MoodTrendPoint } from "@/types/analytics";
import { RoleAwareFilters } from '@/components/ui/RoleAwareFilters';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  Activity, Users, ClipboardList, TrendingUp, Moon, RefreshCw, AlertTriangle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const RISK_COLORS = {
  LOW: "#10B981",      // Emerald 500
  MODERATE: "#F59E0B", // Amber 500
  HIGH: "#F97316",     // Orange 500
  CRITICAL: "#EF4444", // Red 500
};

export default function AnalyticsDashboardPage() {
  const [days, setDays] = useState<number>(30);
  const [centerId, setCenterId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  const buildQueryString = (base: string, extraParams: Record<string, string | number> = {}) => {
    const params = new URLSearchParams();
    if (centerId) params.append("center_id", centerId);
    if (projectId) params.append("project_id", projectId);
    Object.entries(extraParams).forEach(([k, v]) => params.append(k, String(v)));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["analytics", "summary", centerId, projectId],
    queryFn: () => analyticsApi.get<AnalyticsSummary>(buildQueryString("/v1/analytics/summary")),
  });

  const { data: trends, isLoading: isLoadingTrends, isError: isErrorTrends, refetch: refetchTrends } = useQuery({
    queryKey: ["analytics", "trends", days, centerId, projectId],
    queryFn: () => analyticsApi.get<MoodTrendPoint[]>(buildQueryString("/v1/analytics/mood-trends", { days })),
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchTrends();
  };

  const isLoading = isLoadingSummary || isLoadingTrends;
  const isError = isErrorSummary || isErrorTrends;



  // Formatting trend dates
  const formattedTrends = trends?.map(t => ({
    ...t,
    formattedDate: format(parseISO(t.date), "d MMM", { locale: es }),
  })) || [];

  // Risk Pie Chart Data
  const riskData = summary ? [
    { name: "Bajo", value: summary.riskDistribution.LOW, color: RISK_COLORS.LOW },
    { name: "Moderado", value: summary.riskDistribution.MODERATE, color: RISK_COLORS.MODERATE },
    { name: "Alto", value: summary.riskDistribution.HIGH, color: RISK_COLORS.HIGH },
    { name: "Crítico", value: summary.riskDistribution.CRITICAL, color: RISK_COLORS.CRITICAL },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex flex-col space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-indigo-600" />
            Centro de Analíticas Avanzadas
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors shadow-sm"
          title="Actualizar datos"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <RoleAwareFilters 
        onFiltersChange={({ centerId, projectId }) => {
          setCenterId(centerId);
          setProjectId(projectId);
        }} 
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh] flex-col gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Cargando modelos analíticos...</p>
        </div>
      ) : isError || !summary || !trends ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={40} />
          <h2 className="text-xl font-bold text-red-800">Servicio No Disponible</h2>
          <p className="text-red-600 mt-2 text-sm">No se ha podido conectar con el microservicio de analíticas de Python. Asegúrate de que el contenedor auren-analytics está corriendo en el puerto 8001.</p>
          <button 
            onClick={handleRefresh}
            className="mt-6 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Reintentar conexión
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Patients */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">Pacientes Activos</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{summary.activePatients}</p>
          <p className="text-xs text-gray-400 mt-1">De un total de {summary.totalPatients} en base de datos</p>
        </div>

        {/* Global Mood Avg */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">Ánimo Medio (7d)</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{summary.avgMood.toFixed(1)} <span className="text-base font-medium text-gray-400">/ 10</span></p>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
             Indicador general de bienestar
          </p>
        </div>

        {/* Global Anxiety Avg */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">Ansiedad Media (7d)</p>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{summary.avgAnxiety.toFixed(1)} <span className="text-base font-medium text-gray-400">/ 10</span></p>
          <p className="text-xs text-orange-600 mt-1 font-medium">Niveles de estrés autodiagnosticado</p>
        </div>

        {/* Global Sleep Avg */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">Sueño Medio (7d)</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Moon size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{summary.avgSleep.toFixed(1)} <span className="text-base font-medium text-gray-400">h / noche</span></p>
          <p className="text-xs text-gray-400 mt-1">Calidad del descanso promedio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tendencias Clínicas Globales</h3>
              <p className="text-sm text-gray-500">Evolución de medias de Ánimo y Ansiedad</p>
            </div>
            <div className="w-48">
              <SearchableSelect 
                value={days.toString()}
                onChange={(val) => setDays(Number(val))}
                options={[
                  { value: "7", label: "Últimos 7 días" },
                  { value: "14", label: "Últimos 14 días" },
                  { value: "30", label: "Últimos 30 días" },
                ]}
                searchable={false}
              />
            </div>
          </div>
          
          <div className="flex-1 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAnxiety" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="avgMood" name="Ánimo Medio" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="avgAnxiety" name="Ansiedad Media" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAnxiety)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution & Side Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Distribución de Riesgo</h3>
            <p className="text-sm text-gray-500 mb-6">Nivel de riesgo clínico actual por paciente</p>
            
            <div className="h-[220px] w-full flex items-center justify-center">
              {riskData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value} pacientes`, 'Cantidad']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400">Sin datos suficientes</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {riskData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600 font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
