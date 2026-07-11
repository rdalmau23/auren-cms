"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Calendar, Users, AlertTriangle, RefreshCw, Pill, ClipboardList, MessageSquare, Moon } from "lucide-react";
import { api } from "@/lib/api-client";
import { DashboardStats } from "@/types";
import Link from "next/link";
import { GeneralActivityChart } from "./components/GeneralActivityChart";

const severityColors: Record<string, string> = {
  LOW: "bg-gray-50 text-gray-700 border-gray-200",
  MODERATE: "bg-amber-50 text-amber-700 border-amber-100",
  HIGH: "bg-orange-50 text-orange-700 border-orange-100",
  CRITICAL: "bg-red-50 text-red-700 border-red-100",
};

const severityLabels: Record<string, string> = {
  LOW: "Bajo",
  MODERATE: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

const getAlertIcon = (type: string) => {
  if (type.includes("MOOD") || type.includes("ANXIETY")) return <Activity size={18} />;
  if (type.includes("MEDICATION")) return <Pill size={18} />;
  if (type.includes("SLEEP")) return <Moon size={18} />;
  if (type.includes("APPOINTMENT")) return <Calendar size={18} />;
  return <AlertTriangle size={18} />;
};

export default function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return await api.get<DashboardStats>("/v1/dashboard/stats");
    },
  });

  const modules = [
    {
      label: "Pacientes",
      value: data?.activePatients ?? 0,
      description: "Pacientes en tratamiento activo",
      icon: Users,
      bgClass: "bg-blue-50 text-blue-600",
      href: "/dashboard/patients"
    },
    {
      label: "Agenda",
      value: data?.visitsToday ?? 0,
      description: "Citas programadas para hoy",
      icon: Calendar,
      bgClass: "bg-emerald-50 text-emerald-600",
      href: "/dashboard/appointments"
    },
    {
      label: "Alertas",
      value: (data?.activeAlerts ?? 0) + (data?.criticalAlerts ?? 0),
      description: "Requieren revisión clínica",
      icon: AlertTriangle,
      bgClass: "bg-red-50 text-red-600",
      href: "/dashboard/alerts"
    },
    {
      label: "Cuestionarios",
      value: "Ver",
      description: "Evaluaciones clínicas",
      icon: ClipboardList,
      bgClass: "bg-indigo-50 text-indigo-600",
      href: "/dashboard/surveys"
    },
    {
      label: "Medicación",
      value: "Ver",
      description: "Pautas y tratamientos",
      icon: Pill,
      bgClass: "bg-purple-50 text-purple-600",
      href: "/dashboard/medications"
    },
    {
      label: "Chat",
      value: "Ver",
      description: "Mensajería con pacientes",
      icon: MessageSquare,
      bgClass: "bg-teal-50 text-teal-600",
      href: "/dashboard/chat"
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Page header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de actividad clínica en tiempo real
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500 cursor-pointer"
          title="Actualizar datos"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1">
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Link
              key={mod.label}
              href={mod.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group flex flex-col justify-between h-40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">{mod.label}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{mod.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${mod.bgClass} group-hover:scale-110 transition-transform`}>
                  <mod.icon size={28} />
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400 font-normal flex items-center justify-between">
                <span>{mod.description}</span>
                <span className="text-gray-300 group-hover:text-gray-600 transition-colors">&rarr;</span>
              </p>
            </Link>
          ))}
        </div>

        {/* ── General Activity Chart ── */}
        <div className="mt-6 h-[350px]">
          <GeneralActivityChart />
        </div>
      </div>
    </div>
  );
}
