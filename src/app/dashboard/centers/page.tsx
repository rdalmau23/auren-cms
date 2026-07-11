"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { 
  Building2, Plus, Edit2, ShieldAlert, Save, X, 
  MapPin, Phone, Mail, CheckCircle, AlertCircle, Eye
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Center } from "@/types";
import { toast } from "sonner";

export default function CentersPage() {
  const { data: session } = useSession();
  const t = useTranslations("centers");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  // Role detection
  const roles: string[] = (session as any)?.roles || [];
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const isCenterAdmin = roles.includes("CENTER_ADMIN");

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "CLINIC",
    address: "",
    phone: "",
    email: "",
    active: true,
  });

  // Query centers
  const { data: centers = [], isLoading } = useQuery<Center[]>({
    queryKey: ["centers-list"],
    queryFn: async () => {
      return await api.get<Center[]>("/v1/centers");
    },
  });

  // Create center mutation
  const createMutation = useMutation({
    mutationFn: async (newCenter: typeof formData) => {
      return await api.post<Center>("/v1/centers", newCenter);
    },
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["centers-list"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || t("saveError"));
    },
  });

  // Update center mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Center> }) => {
      return await api.put<Center>(`/v1/centers/${payload.id}`, payload.data);
    },
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["centers-list"] });
      setIsModalOpen(false);
      setEditingCenter(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || t("saveError"));
    },
  });

  // Deactivate center mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch<Center>(`/v1/centers/${id}/deactivate`, {});
    },
    onSuccess: () => {
      toast.success(t("deactivateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["centers-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || t("deactivateError"));
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "CLINIC",
      address: "",
      phone: "",
      email: "",
      active: true,
    });
  };

  const openCreateModal = () => {
    setEditingCenter(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (center: Center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name || "",
      type: center.type || "CLINIC",
      address: center.address || "",
      phone: center.phone || "",
      email: center.email || "",
      active: center.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeactivate = (id: string) => {
    if (confirm("¿Seguro que deseas desactivar este centro?")) {
      deactivateMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-96 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-52"></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-52"></div>
        </div>
      </div>
    );
  }

  // Fallback for CENTER_ADMIN and other clinical roles: they work in the first center
  const myCenter = centers.find(c => c.active) || centers[0];

  // Render view for CENTER_ADMIN (editable card)
  if (!isSuperAdmin && isCenterAdmin) {
    if (!myCenter) {
      return (
        <div className="p-6 text-center max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm mt-12">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900">{t("noCenters")}</h2>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full space-y-6 overflow-hidden max-w-3xl mx-auto">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-gray-500" />
            {myCenter.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los detalles operativos y la configuración de tu centro médico.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: myCenter.id, data: formData });
            }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6"
          >
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            Detalles de la Clínica
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Nombre de la Clínica
              </label>
              <input
                type="text"
                name="name"
                defaultValue={myCenter.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tipo de Centro
                </label>
                <select
                  name="type"
                  defaultValue={myCenter.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                >
                  <option value="CLINIC">{t("fields.clinic")}</option>
                  <option value="HOSPITAL">{t("fields.hospital")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={myCenter.phone || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                defaultValue={myCenter.email || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Dirección Física
              </label>
              <input
                type="text"
                name="address"
                defaultValue={myCenter.address || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {updateMutation.isPending ? "Guardando..." : "Guardar Centro"}
            </button>
          </div>
        </form>
      </div>
      </div>
    );
  }

  // Render view for other roles (Read-Only Detail Card)
  if (!isSuperAdmin) {
    if (!myCenter) {
      return (
        <div className="p-6 text-center max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm mt-12">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900">{t("noCenters")}</h2>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full space-y-6 overflow-hidden max-w-2xl mx-auto">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-gray-500" />
            Centro de Salud
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualiza los datos operativos de la clínica asociada a tu perfil.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
                  {myCenter.type === "CLINIC" ? t("fields.clinic") : t("fields.hospital")}
                </span>
                <h2 className="text-xl font-bold text-gray-900">{myCenter.name}</h2>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${myCenter.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {myCenter.active ? t("active") : t("inactive")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400" />
                <span>{myCenter.address || "Sin dirección"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <span>{myCenter.phone || "Sin teléfono"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <span>{myCenter.email || "Sin email"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render view for SUPER_ADMIN (All Centers Table & Creation)
  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-gray-500" />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm animate-in fade-in duration-200"
        >
          <Plus size={18} />
          {t("newCenter")}
        </button>
      </div>

      {/* Centers Table */}
      {centers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-900">{t("noCenters")}</h3>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-white">
                  <th className="px-6 py-4">{t("name")}</th>
                  <th className="px-6 py-4">{t("type")}</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">{t("status")}</th>
                  <th className="px-6 py-4 text-right">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {centers.map((center) => (
                  <tr key={center.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <div>
                        {center.name}
                        <span className="block text-xs font-normal text-gray-400 mt-0.5">{center.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 animate-in fade-in duration-200">
                        {center.type === "CLINIC" ? t("fields.clinic") : t("fields.hospital")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="space-y-0.5 text-xs">
                        <p>{center.phone}</p>
                        <p>{center.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${center.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"} animate-in fade-in duration-200`}>
                        {center.active ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(center)}
                        className="inline-flex items-center p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                        title={t("editCenter")}
                      >
                        <Edit2 size={16} />
                      </button>
                      {center.active && (
                        <button
                          onClick={() => handleDeactivate(center.id)}
                          className="inline-flex items-center p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title={t("deactivateCenter")}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 z-10 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-900">
                {editingCenter ? t("editCenter") : t("newCenter")}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nombre del centro
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Tipo
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                    >
                      <option value="CLINIC">{t("fields.clinic")}</option>
                      <option value="HOSPITAL">{t("fields.hospital")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  <Save size={16} />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
