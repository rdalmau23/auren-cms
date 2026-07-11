"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AlertConfig } from "@/types";
import { Save, AlertTriangle } from "lucide-react";

export function AlertConfigForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AlertConfig>({
    maxDaysWithoutMood: 3,
    maxDaysWithoutMedication: 2,
    criticalAnxietyThreshold: 8,
    criticalDepressionThreshold: 8,
  });

  const { data: config, isLoading } = useQuery<AlertConfig>({
    queryKey: ["alert-config"],
    queryFn: async () => {
      return await api.get<AlertConfig>("/v1/config/alerts");
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: async (data: AlertConfig) => {
      return await api.put<AlertConfig>("/v1/config/alerts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-config"] });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Registro de estado de ánimo */}
        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-gray-900">Estado de Ánimo</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Máximo de días sin registro
              </label>
              <input
                type="number"
                name="maxDaysWithoutMood"
                min="1"
                max="14"
                value={formData.maxDaysWithoutMood}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Genera alerta si el paciente no registra su ánimo en estos días.
              </p>
            </div>
          </div>
        </div>

        {/* Adherencia a medicación */}
        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-gray-900">Medicación</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Dosis omitidas permitidas
              </label>
              <input
                type="number"
                name="maxDaysWithoutMedication"
                min="1"
                max="10"
                value={formData.maxDaysWithoutMedication}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Genera alerta si se omiten esta cantidad de dosis en 48 horas.
              </p>
            </div>
          </div>
        </div>

        {/* Umbrales Clínicos */}
        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-gray-900">Umbrales Clínicos Críticos (0-10)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Umbral de Ansiedad Alta
              </label>
              <input
                type="number"
                name="criticalAnxietyThreshold"
                min="1"
                max="10"
                value={formData.criticalAnxietyThreshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Valor a partir del cual se considera ansiedad elevada sostenida.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Umbral de Depresión Crítica
              </label>
              <input
                type="number"
                name="criticalDepressionThreshold"
                min="1"
                max="10"
                value={formData.criticalDepressionThreshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                (Futuro uso) Valor para activar alertas inmediatas.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
        {mutation.isSuccess && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
            ¡Configuración guardada!
          </span>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          {mutation.isPending ? "Guardando..." : "Guardar Umbrales"}
        </button>
      </div>
    </form>
  );
}
