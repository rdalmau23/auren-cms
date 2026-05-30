"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Patient, PageResponse } from "@/types";

const riskColors = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

const riskLabels = { LOW: "Bajo", MODERATE: "Moderado", HIGH: "Alto", CRITICAL: "Crítico" };

const statusColors = {
  ACTIVE: "bg-blue-50 text-blue-700",
  DISCHARGED: "bg-gray-100 text-gray-600",
  ON_LEAVE: "bg-purple-50 text-purple-700",
  WAITLIST: "bg-yellow-50 text-yellow-700",
};

const statusLabels = { ACTIVE: "Activo", DISCHARGED: "Alta", ON_LEAVE: "Permiso", WAITLIST: "Lista de espera" };

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Build the query endpoint based on search query presence
  const endpoint = searchQuery.trim() 
    ? `/v1/patients/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=8`
    : `/v1/patients?page=${currentPage}&size=8${statusFilter ? `&status=${statusFilter}` : ""}`;

  const { data: pageData, isLoading, error } = useQuery<PageResponse<Patient>>({
    queryKey: ["patients", searchQuery, currentPage, statusFilter],
    queryFn: async () => {
      return await api.get<PageResponse<Patient>>(endpoint);
    },
  });

  const patients = pageData?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión y seguimiento de pacientes</p>
        </div>
        <Link href="/dashboard/patients/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
          <Plus size={18} />
          Nuevo paciente
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0); // Reset to first page
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        
        <div className="w-48">
          <SearchableSelect
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'ACTIVE', label: 'Activos' },
              { value: 'DISCHARGED', label: 'De Alta' },
              { value: 'ON_LEAVE', label: 'De Permiso' },
              { value: 'WAITLIST', label: 'Lista de Espera' },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(0);
            }}
            searchable={false}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm">Ha ocurrido un error al conectar con el servidor de Auren.</p>
        </div>
      )}

      {/* Table / Loading State */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Cargando directorio de pacientes...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No se encontraron pacientes para los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
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
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-semibold text-xs border border-blue-100">
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
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${riskColors[patient.riskLevel]}`}>
                        {riskLabels[patient.riskLevel]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[patient.status]}`}>
                        {statusLabels[patient.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pageData && pageData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Mostrando página {pageData.page + 1} de {pageData.totalPages} ({pageData.totalElements} pacientes en total)
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700">
                    {currentPage + 1}
                  </span>
                  <button 
                    onClick={() => setCurrentPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                    disabled={pageData.last}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
