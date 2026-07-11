"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { 
  Settings as SettingsIcon, Sliders, ClipboardList, Bell, Users, ShieldAlert,
  Inbox, AlertTriangle, ShieldCheck, Check
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api-client";
import { AlertConfigForm } from "./components/AlertConfigForm";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("alertEngine");

  // Fetch real professionals list for the Roles tab
  const { data: professionals = [], isLoading: loadingProfessionals } = useQuery<any[]>({
    queryKey: ["professionals-list-settings"],
    queryFn: async () => {
      return await api.get<any[]>("/v1/professionals");
    },
    enabled: activeTab === "roles",
  });

  // Fetch real audit logs list for the Audit Log tab
  const { data: auditResponse, isLoading: loadingAudit } = useQuery<any>({
    queryKey: ["audit-logs-list-settings"],
    queryFn: async () => {
      return await api.get<any>("/v1/audit-logs?size=20");
    },
    enabled: activeTab === "auditLog",
  });

  const auditLogs = auditResponse?.content || [];

  // Tabs structure
  const tabs = [
    { id: "alertEngine", label: t("tabs.alertEngine"), icon: <Sliders size={18} /> },
    { id: "auditLog", label: t("tabs.auditLog"), icon: <ClipboardList size={18} /> },
    { id: "notifications", label: t("tabs.notifications"), icon: <Bell size={18} /> },
    { id: "roles", label: t("tabs.roles"), icon: <Users size={18} /> },
    { id: "security", label: t("tabs.security"), icon: <ShieldAlert size={18} /> },
  ];

  // Helper component to render empty state placeholders
  const EmptyPlaceholder = ({ title, subtitle, icon: IconComponent }: { title: string; subtitle: string; icon: any }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/30 border border-dashed border-gray-200 rounded-2xl animate-in fade-in duration-200">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
        <IconComponent size={22} />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">{subtitle}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon size={24} className="text-gray-500" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("subtitle")}
        </p>
      </div>

      {/* Tabs list */}
      <div className="shrink-0">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-y-auto">
        
        {/* 1. Alert Engine Tab */}
        {activeTab === "alertEngine" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t("alertEngine.title")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t("alertEngine.subtitle")}</p>
            </div>

            <AlertConfigForm />
          </div>
        )}

        {/* 2. Audit Log Tab */}
        {activeTab === "auditLog" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t("auditLog.title")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t("auditLog.subtitle")}</p>
            </div>

            {loadingAudit ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Cargando registros de auditoría...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyPlaceholder 
                title="Registro de auditoría vacío"
                subtitle="Todavía no se han registrado eventos de auditoría del sistema en la base de datos."
                icon={ClipboardList}
              />
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-inner bg-gray-50/5">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">{t("auditLog.columns.date")}</th>
                      <th className="px-5 py-3">{t("auditLog.columns.user")}</th>
                      <th className="px-5 py-3">{t("auditLog.columns.action")}</th>
                      <th className="px-5 py-3">{t("auditLog.columns.resource")}</th>
                      <th className="px-5 py-3">{t("auditLog.columns.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          {log.userName ? (
                            <div>
                              <p className="font-semibold text-gray-900">{log.userName}</p>
                              {log.userEmail && <p className="text-[10px] text-gray-500 font-mono mt-0.5">{log.userEmail}</p>}
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-900">Sistema</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-bold">
                          {log.action}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-gray-700">{log.entity}</p>
                          {log.entityId && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5" title={log.entityId}>
                              ID: {log.entityId.split('-')[0]}...
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            log.result === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {log.result === "SUCCESS" && <Check size={12} />}
                            {log.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t("notifications.title")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t("notifications.subtitle")}</p>
            </div>

            <EmptyPlaceholder 
              title="Servicio de notificaciones inactivo"
              subtitle="No se han configurado pasarelas de comunicación por correo electrónico (SES) o SMS (Twilio) para este entorno."
              icon={Bell}
            />
          </div>
        )}

        {/* 4. Roles / System Users Tab */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t("roles.title")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t("roles.subtitle")}</p>
            </div>

            {loadingProfessionals ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Cargando usuarios del sistema...</p>
              </div>
            ) : professionals.length === 0 ? (
              <EmptyPlaceholder 
                title="Sin usuarios profesionales registrados"
                subtitle="No hay perfiles profesionales dados de alta en el sistema en este momento."
                icon={Users}
              />
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-inner bg-gray-50/5">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Especialidad</th>
                      <th className="px-5 py-3">Nº Colegiado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {professionals.map((prof) => (
                      <tr key={prof.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {prof.user?.name} {prof.user?.surname}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">
                          {prof.user?.email}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {prof.user?.roles?.map((r: any) => (
                              <span key={r.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {r.name}
                              </span>
                            )) || <span className="text-xs text-gray-400">Sin rol</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {prof.speciality || "Sin especificar"}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">
                          {prof.licenseNumber || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t("security.title")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t("security.subtitle")}</p>
            </div>

            <EmptyPlaceholder 
              title="Políticas de seguridad inactivas"
              subtitle="No hay políticas de seguridad, roles o restricciones adicionales definidas localmente. Toda la seguridad de accesos se gestiona de forma centralizada en Keycloak."
              icon={ShieldAlert}
            />
          </div>
        )}
      </div>
    </div>
  );
}
