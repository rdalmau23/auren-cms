"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Center, Project } from "@/types";
import { api } from "@/lib/api-client";
import { SearchableSelect } from "./SearchableSelect";

interface RoleAwareFiltersProps {
  onFiltersChange: (filters: { centerId?: string; projectId?: string }) => void;
  showCenterFilter?: boolean;
  showProjectFilter?: boolean;
}

export function RoleAwareFilters({
  onFiltersChange,
  showCenterFilter = true,
  showProjectFilter = true,
}: RoleAwareFiltersProps) {
  const { data: session } = useSession();
  const roles = (session as any)?.roles || [];
  
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  // Only SuperAdmins need the center filter, CenterAdmins and Professionals
  // are already filtered implicitly by the backend according to their profile.
  const shouldShowCenterFilter = showCenterFilter && isSuperAdmin;

  const [centers, setCenters] = useState<Center[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        if (shouldShowCenterFilter) {
          const centersResponse = await api.get<Center[]>("/v1/centers");
          if (centersResponse) setCenters(centersResponse as any);
        }
        
        if (showProjectFilter) {
          const projectsResponse = await api.get<Project[]>("/v1/projects");
          if (projectsResponse) setProjects(projectsResponse as any);
        }
      } catch (e) {
        console.error("Error loading filter data", e);
      }
    }
    loadData();
  }, [shouldShowCenterFilter, showProjectFilter]);

  // Use useEffect to call onFiltersChange to ensure it runs with the latest state
  useEffect(() => {
    onFiltersChange({ 
      centerId: selectedCenterId || undefined, 
      projectId: selectedProjectId || undefined 
    });
  }, [selectedCenterId, selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shouldShowCenterFilter && !showProjectFilter) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {shouldShowCenterFilter && (
        <div className="flex-1 max-w-xs">
          <SearchableSelect
            options={[
              { value: "", label: "Todos los Centros" },
              ...centers.map(c => ({ value: c.id, label: c.name }))
            ]}
            value={selectedCenterId}
            onChange={setSelectedCenterId}
            searchable={false}
          />
        </div>
      )}

      {showProjectFilter && (
        <div className="flex-1 max-w-xs">
          <SearchableSelect
            options={[
              { value: "", label: "Todos los Ensayos / Proyectos" },
              ...projects.map(p => ({ value: p.id, label: p.name }))
            ]}
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            searchable={false}
          />
        </div>
      )}
    </div>
  );
}
