"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Pill, Moon, Calendar, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const { data: session } = useSession();
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");

  // Fetch logged-in user profile to get professionalId for acknowledge
  const { data: userProfile } = useQuery<{ id: string; professionalId: string } | null>({
    queryKey: ['userProfile', (session as any)?.accessToken],
    queryFn: async () => {
      const token = (session as any)?.accessToken;
      if (!token) return null;
      return await api.get<{ id: string; professionalId: string }>('/v1/users/me', { token });
    },
    enabled: !!(session as any)?.accessToken,
  });

  const { data: alerts, isLoading } = useQuery<any[]>({
    queryKey: ["clinical-alerts", statusFilter],
    queryFn: async () => {
      return await api.get<any[]>(`/v1/alerts/filtered?status=${statusFilter}`);
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => {
      const userId = userProfile?.id ?? '00000000-0000-0000-0000-000000000000';
      return api.patch(`/v1/alerts/${id}/acknowledge?userId=${userId}`, {});
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["clinical-alerts", statusFilter] });
      const previous = queryClient.getQueryData<any[]>(["clinical-alerts", statusFilter]);
      queryClient.setQueryData<any[]>(["clinical-alerts", statusFilter], (old) =>
        old?.filter((a) => a.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      toast.error(t("errorProcess"));
      if (context?.previous) {
        queryClient.setQueryData(["clinical-alerts", statusFilter], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-alerts"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/alerts/${id}/resolve`, {}),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["clinical-alerts", statusFilter] });
      const previous = queryClient.getQueryData<any[]>(["clinical-alerts", statusFilter]);
      queryClient.setQueryData<any[]>(["clinical-alerts", statusFilter], (old) =>
        old?.filter((a) => a.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      toast.error(t("errorProcess"));
      if (context?.previous) {
        queryClient.setQueryData(["clinical-alerts", statusFilter], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-alerts"] });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-white rounded-2xl border border-gray-200 p-6"></div>;
  }

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600" />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex gap-2">
          {["ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === status
                  ? "bg-blue-50 text-blue-700 border-blue-200 border"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              {status === "ACTIVE" ? t("status.active") : status === "ACKNOWLEDGED" ? t("status.acknowledged") : t("status.resolved")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10 bg-white">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severidad</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alerta</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <CheckCircle className="mx-auto mb-2 text-gray-300" size={32} />
                    <p>No hay alertas en este estado.</p>
                  </td>
                </tr>
              ) : (
                alerts?.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${severityColors[alert.severity]}`}>
                        <div className={`flex-shrink-0 ${alert.severity === 'CRITICAL' ? 'animate-pulse text-red-600' : ''}`}>
                          {getAlertIcon(alert.alertType)}
                        </div>
                        {severityLabels[alert.severity]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{alert.patientName}</div>
                      <Link href={`/dashboard/patients/${alert.patientId}`} className="text-xs text-blue-600 hover:underline">
                        Ver perfil
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{alert.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      {alert.status === "ACTIVE" && (
                        <button
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acknowledgeMutation.isPending ? t("actions.processing") : t("actions.acknowledge")}
                        </button>
                      )}
                      {(alert.status === "ACTIVE" || alert.status === "ACKNOWLEDGED") && (
                        <button
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolveMutation.isPending ? t("actions.processing") : t("actions.resolve")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
