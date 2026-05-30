"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Calendar, Users, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import { DashboardStats } from "@/types";
import Link from "next/link";

const riskColors = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-100",
  MODERATE: "bg-amber-50 text-amber-700 border-amber-100",
  HIGH: "bg-orange-50 text-orange-700 border-orange-100",
  CRITICAL: "bg-red-50 text-red-700 border-red-100",
};

const riskLabels = {
  LOW: "Bajo",
  MODERATE: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

export default function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return await api.get<DashboardStats>("/v1/dashboard/stats");
    },
  });

  const stats = [
    {
      label: "Pacientes activos",
      value: data?.activePatients ?? 0,
      description: "Pacientes en tratamiento activo",
      icon: Users,
      color: "blue",
      bgClass: "bg-blue-50 text-blue-600",
      textClass: "text-blue-700",
    },
    {
      label: "Visitas hoy",
      value: data?.visitsToday ?? 0,
      description: "Citas programadas para hoy",
      icon: Calendar,
      color: "emerald",
      bgClass: "bg-emerald-50 text-emerald-600",
      textClass: "text-emerald-700",
    },
    {
      label: "Cuestionarios pendientes",
      value: data?.pendingSurveys ?? 0,
      description: "Respuestas pendientes de revisión",
      icon: Activity,
      color: "amber",
      bgClass: "bg-amber-50 text-amber-600",
      textClass: "text-amber-700",
    },
    {
      label: "Alertas críticas",
      value: data?.criticalAlerts ?? 0,
      description: "Pacientes con riesgo crítico",
      icon: AlertTriangle,
      color: "red",
      bgClass: "bg-red-50 text-red-600",
      textClass: "text-red-700",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-lg mt-2"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-32"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80"></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50/50 rounded-3xl border border-red-100 p-8">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Error al cargar estadísticas</h2>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          No se pudo conectar con el backend. Asegúrate de que el servidor está corriendo en el puerto 8080.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de actividad clínica en tiempo real
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
          title="Actualizar datos"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgClass}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400 font-normal">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Dashboard details split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitas de hoy */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Visitas de hoy</h2>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver agenda completa
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {!data?.upcomingVisits || data.upcomingVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Clock size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">No hay visitas programadas para hoy</p>
              </div>
            ) : (
              data.upcomingVisits.map((visit) => {
                const date = new Date(visit.startTime);
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={visit.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {visit.patientName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{visit.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {formattedTime} — {visit.type === "INDIVIDUAL" ? "Sesión Individual" : "Sesión Familiar"}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      visit.status === "SCHEDULED" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {visit.status === "SCHEDULED" ? "Programada" : "Confirmada"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alertas recientes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Alertas clínicas y de riesgo</h2>
            <Link
              href="/dashboard/patients"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todos los pacientes
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {!data?.recentAlerts || data.recentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Users size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">No hay pacientes con alertas de riesgo activo</p>
              </div>
            ) : (
              data.recentAlerts.map((alert) => (
                <div
                  key={alert.patientId}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${riskColors[alert.riskLevel]}`}
                >
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{alert.patientName}</p>
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Riesgo {riskLabels[alert.riskLevel]}
                      </span>
                    </div>
                    <p className="text-xs mt-1 line-clamp-2 opacity-90">
                      {alert.message || "Paciente bajo observación médica."}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
