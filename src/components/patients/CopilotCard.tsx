import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Sparkles, BrainCircuit, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { EventTracker } from '@/lib/analytics';

interface CopilotResponse {
  summary: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  key_factors: string[];
}

const riskConfig = {
  LOW: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: <ShieldCheck size={18} className="text-emerald-600" />
  },
  MODERATE: {
    color: 'text-amber-700',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: <Activity size={18} className="text-amber-600" />
  },
  HIGH: {
    color: 'text-orange-700',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: <AlertTriangle size={18} className="text-orange-600" />
  },
  CRITICAL: {
    color: 'text-red-700',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: <AlertTriangle size={18} className="text-red-600 animate-pulse" />
  }
};

export function CopilotCard({ patientId }: { patientId: string }) {
  const { data: session } = useSession();

  const { data, isLoading, error } = useQuery<CopilotResponse>({
    queryKey: ['copilot-summary', patientId],
    queryFn: () => api.get(`/v1/patients/${patientId}/copilot-summary`, {
      headers: {
        'X-Tenant-ID': (session as any)?.centerId || 'auren'
      }
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50/30 rounded-2xl border border-indigo-100 p-6 flex animate-pulse">
        <div className="flex gap-4 items-start w-full">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <BrainCircuit size={24} className="text-indigo-400" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-indigo-200/50 rounded w-1/4"></div>
            <div className="h-3 bg-indigo-200/30 rounded w-3/4"></div>
            <div className="h-3 bg-indigo-200/30 rounded w-full"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-6 w-20 bg-indigo-200/40 rounded-full"></div>
              <div className="h-6 w-24 bg-indigo-200/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Silent fail if the AI service is down
  }

  // Effect to track AI insight views
  useEffect(() => {
    EventTracker.track({
      name: 'AI_Insights_Viewed',
      properties: {
        patientId,
        riskLevel: data.risk_level
      }
    });
  }, [patientId, data.risk_level]);

  const config = riskConfig[data.risk_level];

  return (
    <div className="relative overflow-hidden w-full bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 p-32 -m-16 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-inner">
                <Sparkles size={16} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
                AI Clinical Copilot
              </h3>
            </div>
            
            <div className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${config.bg} ${config.border} ${config.color}`}>
              {config.icon}
              <span className="font-semibold text-sm">
                Riesgo: {data.risk_level}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {data.summary}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {data.key_factors.map((factor, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
