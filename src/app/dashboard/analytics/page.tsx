"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/analytics-client";
import { AnalyticsSummary, MoodTrendPoint, PharmacologyAnalytics } from "@/types/analytics";
import { RoleAwareFilters } from '@/components/ui/RoleAwareFilters';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  Activity, Users, ClipboardList, TrendingUp, Moon, RefreshCw, AlertTriangle, Pill, ShieldAlert
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";

const RISK_COLORS = {
  LOW: "#10B981",      // Emerald 500
  MODERATE: "#F59E0B", // Amber 500
  HIGH: "#F97316",     // Orange 500
  CRITICAL: "#EF4444", // Red 500
};

export default function AnalyticsDashboardPage() {
  const t = useTranslations("pharmacology");
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

  const { data: pharmacology, isLoading: isLoadingPharm, isError: isErrorPharm, refetch: refetchPharm } = useQuery({
    queryKey: ["analytics", "pharmacology", centerId, projectId],
    queryFn: () => analyticsApi.get<PharmacologyAnalytics>(buildQueryString("/v1/analytics/pharmacology")),
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchTrends();
    refetchPharm();
  };

  const isLoading = isLoadingSummary || isLoadingTrends || isLoadingPharm;
  const isError = isErrorSummary || isErrorTrends || isErrorPharm;

  // Formatting trend dates
  const formattedTrends = trends?.map(tPoint => ({
    ...tPoint,
    formattedDate: format(parseISO(tPoint.date), "d MMM", { locale: es }),
  })) || [];

  // Risk Pie Chart Data
  const riskData = summary ? [
    { name: "Bajo", value: summary.riskDistribution.LOW, color: RISK_COLORS.LOW },
    { name: "Moderado", value: summary.riskDistribution.MODERATE, color: RISK_COLORS.MODERATE },
    { name: "Alto", value: summary.riskDistribution.HIGH, color: RISK_COLORS.HIGH },
    { name: "Crítico", value: summary.riskDistribution.CRITICAL, color: RISK_COLORS.CRITICAL },
  ].filter(d => d.value > 0) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Intentar traducir la etiqueta si es una categoría
      const translatedLabel = t(`categories.${label}` as any) || label;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-semibold text-gray-800 mb-1">{translatedLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium flex items-center justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-6 pb-8 h-full overflow-y-auto pr-2">
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
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <RoleAwareFilters 
          onFiltersChange={({ centerId, projectId }) => {
            setCenterId(centerId);
            setProjectId(projectId);
          }} 
        />
        <div className="text-sm text-gray-400 font-medium -mt-2">
          * Selecciona el proyecto ENFA-01 para ver los datos farmacológicos.
        </div>
      </div>

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

          {/* Pharmacology Section */}
          {pharmacology && pharmacology.totalLogs > 0 && (
            <>
              <div className="pt-8 border-t border-gray-200 mt-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                    <Pill size={24} />
                  </div>
                  {t("title")}
                </h2>
                <p className="text-gray-500 mb-8">{t("subtitle")}</p>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Adherencia por Categoría */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t("adherenceByCategory")}</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pharmacology.adherenceByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="category" tickFormatter={(val) => t(`categories.${val}` as any) || val} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="adherence" 
                            name={t("adherence")} 
                            fill="#8B5CF6" 
                            radius={[6, 6, 0, 0]} 
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Rendimiento por Fármaco */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900">{t("drugPerformance")}</h3>
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-500">{t("overallAdherence")}</span>
                        <span className="text-xl font-bold text-purple-600">{pharmacology.overallAdherence.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-lg">
                          <tr>
                            <th className="px-4 py-3 rounded-l-lg">{t("medication")}</th>
                            <th className="px-4 py-3">{t("category")}</th>
                            <th className="px-4 py-3">{t("adherence")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pharmacology.adherenceByMedication.map((drug, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-4 font-medium text-gray-900">{drug.medication}</td>
                              <td className="px-4 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {t(`categories.${drug.category}` as any) || drug.category}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">{drug.adherence.toFixed(1)}%</span>
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${drug.adherence > 80 ? 'bg-emerald-500' : drug.adherence > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                      style={{ width: `${drug.adherence}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Correlaciones Clínicas */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">{t("clinicalCorrelations")}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {pharmacology.correlations.map((corr, idx) => (
                      <div key={idx} className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors">
                        <div className="font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">{t(`categories.${corr.category}` as any) || corr.category}</div>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1 text-sm">
                              <span className="text-gray-500 flex items-center gap-2"><Activity size={14}/> {t("avgMood")}</span>
                              <span className="font-semibold">{corr.avgMood.toFixed(1)} / 10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(corr.avgMood / 10) * 100}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1 text-sm">
                              <span className="text-gray-500 flex items-center gap-2"><ShieldAlert size={14}/> {t("avgAnxiety")}</span>
                              <span className="font-semibold">{corr.avgAnxiety.toFixed(1)} / 10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(corr.avgAnxiety / 10) * 100}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1 text-sm">
                              <span className="text-gray-500 flex items-center gap-2"><Moon size={14}/> {t("avgSleep")}</span>
                              <span className="font-semibold">{corr.avgSleep.toFixed(1)} h</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(corr.avgSleep / 12) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
