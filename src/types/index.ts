// ─── Patient Types ──────────────────────────────────────────

export interface Patient {
  id: string;
  userId: string;
  patientCode: string;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  dni: string | null;
  nhc: string | null;
  centerId: string;
  centerName: string;
  birthDate: string | null;
  gender: string | null;
  diagnosis: string | null;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  admissionDate: string | null;
  dischargeDate: string | null;
  status: "ACTIVE" | "DISCHARGED" | "ON_LEAVE" | "WAITLIST";
  isSmoker: boolean;
  alcoholConsumption: "NONE" | "OCCASIONAL" | "FREQUENT";
  substanceUse: string | null;
  sportsActivity: "NONE" | "OCCASIONAL" | "REGULAR";
  physicalIllnesses: string | null;
  familyProblems: string | null;
  relapsesHistory: string | null;
  hasPriorAdmissions: boolean;
  priorAdmissionsCount: number;
  lastAdmissionReason: string | null;
  bloodType: string | null;
  allergies: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  civilStatus: string | null;
  occupation: string | null;
  educationLevel: string | null;
  housingSituation: string | null;
  pathologies: Pathology[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreateRequest {
  userId?: string;
  email?: string;
  name?: string;
  surname?: string;
  phone?: string;
  dni?: string;
  nhc?: string;
  centerId?: string; // Optional now, since we infer it for non-admins
  primaryProfessionalId?: string;
  extraProfessionalIds?: string[];
  birthDate?: string;
  gender?: string;
  diagnosis?: string;
  riskLevel?: string;
  admissionDate?: string;
  isSmoker?: boolean;
  alcoholConsumption?: string;
  substanceUse?: string;
  sportsActivity?: string;
  physicalIllnesses?: string;
  familyProblems?: string;
  relapsesHistory?: string;
  hasPriorAdmissions?: boolean;
  priorAdmissionsCount?: number;
  lastAdmissionReason?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  civilStatus?: string;
  occupation?: string;
  educationLevel?: string;
  housingSituation?: string;
  pathologyIds?: string[];
}

// ─── Pathology Types ────────────────────────────────────────

export interface Pathology {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

// ─── TCA Types ──────────────────────────────────────────────

export interface TCAMealLogResponse {
  id: string;
  patientId: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  foodDescription: string | null;
  emotions: string | null;
  bingeUrge: boolean;
  purgeUrge: boolean;
  date: string;
  createdAt: string;
}

export interface TCAWeightLogResponse {
  id: string;
  patientId: string;
  weight: number;
  notes: string | null;
  date: string;
  createdAt: string;
}

// ─── Appointment Types ──────────────────────────────────────

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  type: "INDIVIDUAL" | "GROUP" | "FAMILY" | "EMERGENCY" | "FOLLOW_UP" | "INITIAL" | "TELEMATIC";
  notes: string | null;
  createdAt: string;
}

// ─── Medication Types ───────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  activeSubstance: string | null;
  form: "TABLET" | "CAPSULE" | "LIQUID" | "PATCH" | "INJECTION" | "OTHER";
  strength: string | null;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  medicationForm: string;
  medicationStrength: string | null;
  name: string;
  instructions: string | null;
  slots: ScheduleTimeSlot[];
}

export interface ScheduleTimeSlot {
  id: string;
  time: string;
  quantity: number;
  unit: "TABLET" | "ML" | "MG" | "UNITS";
}

export interface Treatment {
  id: string;
  patientId: string;
  patientName: string;
  scheduleId: string;
  scheduleName: string;
  medicationName: string;
  medicationStrength: string | null;
  prescribedById: string | null;
  prescribedByName: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  notes: string | null;
  slots: ScheduleTimeSlot[];
}

export interface Prescription {
  id: string;
  patientId: string;
  medicationId: string;
  startDate: string;
  endDate: string | null;
  dosage: string;
  frequency: string;
  instructions: string | null;
  active: boolean;
}

// ─── Survey Types ───────────────────────────────────────────

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string | null;
  version: string;
  questions: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: "LIKERT" | "MULTIPLE_CHOICE" | "FREE_TEXT" | "YES_NO" | "NUMERIC_SCALE";
  required: boolean;
  position: number;
  options: string | null;
  minValue: number | null;
  maxValue: number | null;
}

export interface SurveyResponse {
  id: string;
  patientId: string;
  surveyTemplateId: string;
  score: number | null;
  completedAt: string;
  surveyTemplate: SurveyTemplate;
  answers?: SurveyAnswer[];
}

export interface SurveyAnswer {
  id: string;
  questionId: string;
  answer: string;
}

// ─── Mood Types ─────────────────────────────────────────────

export interface DailyMood {
  id: string;
  patientId: string;
  moodScore: number;
  anxietyScore: number | null;
  sleepHours: number | null;
  energyScore: number | null;
  notes: string | null;
  createdAt: string;
}

// ─── Modules Types ───────────────────────────────────────────

export interface PatientModule {
  moduleId: string;
  code: string;
  name: string;
  isActive: boolean;
}

// ─── Project Types ───────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

// ─── Common Types ───────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Professional {
  id: string;
  userId: string;
  speciality: string | null;
  licenseNumber: string | null;
}

export interface Center {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export interface DashboardStats {
  activePatients: number;
  visitsToday: number;
  activeAlerts: number;
  criticalAlerts: number;
  upcomingVisits: {
    id: string;
    patientName: string;
    startTime: string;
    status: string;
    type: string;
  }[];
  clinicalAlerts: {
    id: string;
    patientId: string;
    patientName: string;
    alertType: string;
    severity: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  language: string;
  professionalId: string;
  speciality: string;
  licenseNumber: string;
}

export interface AlertConfig {
  maxDaysWithoutMood: number;
  maxDaysWithoutMedication: number;
  criticalAnxietyThreshold: number;
  criticalDepressionThreshold: number;
}
