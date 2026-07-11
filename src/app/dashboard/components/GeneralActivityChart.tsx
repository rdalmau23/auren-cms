"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { api } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

interface ActivityChartItem {
  date: string;
  visits: number;
  alerts: number;
}

export function GeneralActivityChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "activity-chart"],
    queryFn: () => api.get<ActivityChartItem[]>("/v1/dashboard/activity-chart"),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-500">Error al cargar la gráfica de actividad.</p>
      </div>
    );
  }

  // Formatting dates for the X-axis
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), "d MMM", { locale: es }),
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Actividad General</h3>
        <p className="text-sm text-gray-500">
          Volumen de citas y alertas generadas en los últimos 14 días.
        </p>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 15 }}
          >
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area
              type="monotone"
              dataKey="visits"
              name="Visitas Agendadas"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVisits)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }}
            />
            <Area
              type="monotone"
              dataKey="alerts"
              name="Alertas Clínicas"
              stroke="#EF4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAlerts)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#EF4444' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
