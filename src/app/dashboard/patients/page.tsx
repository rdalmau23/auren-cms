"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api-client";
import { RoleAwareFilters } from '@/components/ui/RoleAwareFilters';
import { Patient, PageResponse } from "@/types";

const riskColors: Record<string, "success" | "warning" | "danger" | "default"> = {
  LOW: "success",
  MODERATE: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
};

const riskLabels: Record<string, string> = { LOW: "Bajo", MODERATE: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" };

const statusColors: Record<string, "blue" | "default" | "purple" | "warning"> = {
  ACTIVE: "blue",
  DISCHARGED: "default",
  ON_LEAVE: "purple",
  WAITLIST: "warning",
};

const statusLabels = { ACTIVE: "Activo", DISCHARGED: "Alta", ON_LEAVE: "Permiso", WAITLIST: "Lista de espera" };

export default function PatientsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [centerId, setCenterId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el paciente"),
  });

  const handleDelete = async (patient: Patient) => {
    const isConfirmed = await confirm({
      title: 'Eliminar paciente',
      message: `¿Estás seguro de que quieres eliminar a ${patient.name} ${patient.surname}? Esta acción revocará su acceso.`,
      variant: 'danger',
    });

    if (isConfirmed) {
      deleteMutation.mutate(patient.id);
    }
  };

  const endpoint = searchQuery.trim() 
    ? `/v1/patients/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=8`
    : `/v1/patients?page=${currentPage}&size=8${statusFilter ? `&status=${statusFilter}` : ""}${centerId ? `&centerId=${centerId}` : ""}${projectId ? `&projectId=${projectId}` : ""}`;

  const { data: pageData, isLoading, error } = useQuery<PageResponse<Patient>>({
    queryKey: ["patients", searchQuery, currentPage, statusFilter, centerId, projectId],
    queryFn: async () => {
      return await api.get<PageResponse<Patient>>(endpoint);
    },
  });

  const patients = pageData?.content || [];

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500">Gestiona y visualiza la información de tus pacientes.</p>
        </div>
        <Button 
          variant="default"
          onClick={() => router.push("/dashboard/patients/new")}
          className="gap-2"
        >
          <Plus size={18} />
          Nuevo Paciente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 shrink-0">
        <RoleAwareFilters 
          onFiltersChange={({ centerId, projectId }) => {
            setCenterId(centerId);
            setProjectId(projectId);
            setCurrentPage(0);
          }} 
        />
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <SearchableSelect
            placeholder="Filtrar por estado"
            options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || "")}
            className="w-48"
          />
        </div>
      </div>

      {/* Table / Loading State */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Cargando directorio de pacientes...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-gray-400 text-sm">No se encontraron pacientes para los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 bg-white">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Paciente</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Diagnóstico</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Centro</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Riesgo</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Estado</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-semibold text-xs border border-blue-100 animate-in fade-in duration-200">
                            {patient.name[0]}{patient.surname[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{patient.name} {patient.surname}</p>
                            <p className="text-xs text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 line-clamp-1 max-w-[240px]">{patient.diagnosis || "No diagnosticado"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{patient.centerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={riskColors[patient.riskLevel] || "default"}>
                          {riskLabels[patient.riskLevel] || patient.riskLevel}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColors[patient.status] || "default"}>
                          {statusLabels[patient.status] || patient.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Ver ficha
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(patient)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageData && pageData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
                <p className="text-sm text-gray-500">
                  Mostrando página {pageData.page + 1} de {pageData.totalPages} ({pageData.totalElements} pacientes en total)
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700">
                    {currentPage + 1}
                  </span>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                    disabled={pageData.last}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
