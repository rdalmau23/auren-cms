// ─── Analytics Types (from auren-analytics Python service) ──────

export interface AnalyticsSummary {
  activePatients: number;
  totalPatients: number;
  avgMood: number;
  avgAnxiety: number;
  avgSleep: number;
  riskDistribution: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
    CRITICAL: number;
  };
  appointmentsToday: number;
  totalSurveys: number;
}

export interface MoodTrendPoint {
  date: string;
  avgMood: number;
  avgAnxiety: number;
  avgSleep: number;
  entries: number;
}

export interface PatientAnalyticsSummary {
  recentMoods: {
    date: string;
    moodScore: number;
    anxietyScore: number | null;
    sleepHours: number | null;
    energyScore: number | null;
  }[];
  statistics: {
    avgMood: number;
    minMood: number;
    maxMood: number;
    avgAnxiety: number;
    avgSleep: number;
    totalEntries: number;
  };
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  surveysCompleted: number;
}

export interface PharmacologyCategoryStats {
  category: string;
  adherence: number;
  totalLogs: number;
}

export interface PharmacologyMedicationStats {
  medication: string;
  category: string;
  adherence: number;
  totalLogs: number;
}

export interface PharmacologyCorrelations {
  category: string;
  avgMood: number;
  avgAnxiety: number;
  avgSleep: number;
}

export interface PharmacologyAnalytics {
  overallAdherence: number;
  totalLogs: number;
  adherenceByCategory: PharmacologyCategoryStats[];
  adherenceByMedication: PharmacologyMedicationStats[];
  correlations: PharmacologyCorrelations[];
}
