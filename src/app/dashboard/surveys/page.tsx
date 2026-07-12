'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClipboardList, Plus, ChevronRight, CheckCircle2,
  FileText, BarChart2, Trash2, X, Save, ArrowLeft,
  TrendingUp, Users, Edit
} from 'lucide-react';
import { SlideOver } from '@/components/ui/SlideOver';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RoleAwareFilters } from '@/components/ui/RoleAwareFilters';
import { SurveyTemplate, SurveyQuestion, SurveyResponse, PageResponse, Patient } from '@/types';

// ─── Question type options ────────────────────────────────────
const QUESTION_TYPES = ['LIKERT', 'MULTIPLE_CHOICE', 'FREE_TEXT', 'YES_NO', 'NUMERIC_SCALE'] as const;

type QuestionType = typeof QUESTION_TYPES[number];

interface DraftQuestion {
  question: string;
  type: QuestionType;
  required: boolean;
  position: number;
  options: string;
  minValue: string;
  maxValue: string;
}

// ─── Main Page ────────────────────────────────────────────────
export default function SurveysPage() {
  const t = useTranslations('surveys');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'results'>('templates');
  const [centerId, setCenterId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  // Template Slide-Over state
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateVersion, setTemplateVersion] = useState('1.0');
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    { question: '', type: 'LIKERT', required: true, position: 1, options: '', minValue: '1', maxValue: '5' },
  ]);

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const confirm = useConfirm();

  // Results state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [evolutionTemplateId, setEvolutionTemplateId] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────
  const { data: templates = [], isLoading: loadingTemplates } = useQuery<SurveyTemplate[]>({
    queryKey: ['survey-templates'],
    queryFn: () => api.get<SurveyTemplate[]>('/v1/surveys/templates'),
  });

  const { data: patientsPage } = useQuery<PageResponse<Patient>>({
    queryKey: ['patients', centerId, projectId],
    queryFn: () => {
      let url = '/v1/patients?size=100';
      if (centerId) url += `&centerId=${centerId}`;
      if (projectId) url += `&projectId=${projectId}`;
      return api.get<PageResponse<Patient>>(url);
    },
  });
  const patients = patientsPage?.content ?? [];

  const { data: responsesPage, isLoading: loadingResponses } = useQuery<PageResponse<SurveyResponse>>({
    queryKey: ['survey-responses', selectedPatientId],
    queryFn: () => api.get<PageResponse<SurveyResponse>>(`/v1/surveys/responses/patient/${selectedPatientId}?size=50`),
    enabled: !!selectedPatientId,
  });
  const responses = responsesPage?.content ?? [];

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Evolution query (when user clicks "View Evolution" on a response)
  const { data: evolutionData } = useQuery<SurveyResponse[]>({
    queryKey: ['survey-evolution', selectedPatientId, evolutionTemplateId],
    queryFn: () =>
      api.get<SurveyResponse[]>(`/v1/surveys/responses/evolution/${selectedPatientId}/${evolutionTemplateId}`),
    enabled: !!(selectedPatientId && evolutionTemplateId),
  });

  // ─── Mutations ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: Omit<SurveyTemplate, 'id'>) =>
      api.post<SurveyTemplate>('/v1/surveys/templates', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-templates'] });
      toast.success(t('successCreate'));
      setSlideOverOpen(false);
      resetForm();
    },
    onError: () => toast.error(t('errorCreate')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Omit<SurveyTemplate, 'id'> }) =>
      api.put<SurveyTemplate>(`/v1/surveys/templates/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-templates'] });
      toast.success('Plantilla actualizada correctamente');
      setSlideOverOpen(false);
      resetForm();
    },
    onError: () => toast.error('Error al actualizar plantilla'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/surveys/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-templates'] });
      toast.success('Plantilla eliminada correctamente');
    },
    onError: () => toast.error('Error al eliminar plantilla'),
  });

  // ─── Helpers ─────────────────────────────────────────────
  const resetForm = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateVersion('1.0');
    setDraftQuestions([
      { question: '', type: 'LIKERT', required: true, position: 1, options: '', minValue: '1', maxValue: '5' },
    ]);
  };

  const addQuestion = () => {
    setDraftQuestions(prev => [
      ...prev,
      {
        question: '',
        type: 'LIKERT',
        required: true,
        position: prev.length + 1,
        options: '',
        minValue: '1',
        maxValue: '5',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setDraftQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, position: i + 1 })));
  };

  const updateQuestion = (index: number, field: keyof DraftQuestion, value: string | boolean) => {
    setDraftQuestions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCreateTemplate = () => {
    if (!templateName.trim() || draftQuestions.some(q => !q.question.trim())) {
      toast.error('Completa el nombre y todos los enunciados de las preguntas');
      return;
    }

    const payload = {
      name: templateName,
      description: templateDescription || null,
      version: templateVersion,
      active: true,
      questions: draftQuestions.map((q, i) => ({
        question: q.question,
        type: q.type,
        required: q.required,
        position: i + 1,
        options: q.options || null,
        minValue: q.type === 'LIKERT' || q.type === 'NUMERIC_SCALE' ? parseFloat(q.minValue) : null,
        maxValue: q.type === 'LIKERT' || q.type === 'NUMERIC_SCALE' ? parseFloat(q.maxValue) : null,
      })),
    };

    if (editingTemplateId) {
      updateMutation.mutate({ id: editingTemplateId, payload: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const handleEditTemplate = (template: SurveyTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateVersion(template.version);
    setDraftQuestions(
      template.questions && template.questions.length > 0
        ? template.questions.map(q => ({
            question: q.question,
            type: q.type,
            required: q.required,
            position: q.position,
            options: q.options || '',
            minValue: q.minValue !== null && q.minValue !== undefined ? q.minValue.toString() : '1',
            maxValue: q.maxValue !== null && q.maxValue !== undefined ? q.maxValue.toString() : '5',
          }))
        : [{ question: '', type: 'LIKERT', required: true, position: 1, options: '', minValue: '1', maxValue: '5' }]
    );
    setSlideOverOpen(true);
  };

  const handleDeleteTemplate = async (template: SurveyTemplate) => {
    const isConfirmed = await confirm({
      title: 'Eliminar plantilla',
      message: `¿Estás seguro de que quieres eliminar la plantilla "${template.name}"?`,
      variant: 'danger',
    });

    if (isConfirmed) {
      deleteMutation.mutate(template.id);
    }
  };

  const patientOptions = patients.map(p => ({
    value: p.id,
    label: `${p.name} ${p.surname}`,
    sublabel: p.email,
    avatarInitials: `${p.name?.[0] ?? ''}${p.surname?.[0] ?? ''}`.toUpperCase(),
  }));

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ClipboardList size={24} className="text-primary-600" />
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={() => setSlideOverOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            {t('newTemplate')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 shrink-0">
        {(['templates', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab === 'templates' ? <FileText size={16} /> : <BarChart2 size={16} />}
            {tab === 'templates' ? t('tabTemplates') : t('tabResults')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── Templates Tab ── */}
        {activeTab === 'templates' && (
          <div className="space-y-3 pb-4">
            {loadingTemplates ? (
              [1, 2, 3].map(n => (
                <div key={n} className="h-24 bg-neutral-50 rounded-2xl border border-neutral-100 animate-pulse" />
              ))
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                <ClipboardList size={48} className="mb-4 text-neutral-200" />
                <p className="text-sm font-medium">{t('noTemplates')}</p>
                <button
                  onClick={() => setSlideOverOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition"
                >
                  <Plus size={16} />
                  {t('newTemplate')}
                </button>
              </div>
            ) : (
              templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleEditTemplate(template)}
                  className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-primary-300 transition hover:shadow-md cursor-pointer relative group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-neutral-900 truncate">{template.name}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-success-50 text-success-600 border border-success-100">
                          v{template.version}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100">
                          {t('activeLabel')}
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{template.description}</p>
                      )}
                      <p className="text-xs text-neutral-400 font-medium">
                        {t('questionsCount', { count: template.questions?.length ?? 0 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTemplate(template); }}
                        className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Editar / Ver detalle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template); }}
                        className="p-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Questions Preview */}
                  {template.questions && template.questions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {template.questions
                        .sort((a, b) => a.position - b.position)
                        .slice(0, 3)
                        .map((q, i) => (
                          <div key={q.id} className="flex items-start gap-2 text-sm text-neutral-600">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="truncate block">{q.question}</span>
                              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                                {t(`questionTypes.${q.type}`)}
                                {q.required && ' · Obligatoria'}
                              </span>
                            </div>
                          </div>
                        ))}
                      {template.questions.length > 3 && (
                        <p className="text-xs text-neutral-400 pl-7">
                          +{template.questions.length - 3} preguntas más
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Results Tab ── */}
        {activeTab === 'results' && (
          <div className="space-y-4 pb-4">
            <RoleAwareFilters 
              onFiltersChange={({ centerId, projectId }) => {
                setCenterId(centerId);
                setProjectId(projectId);
                setSelectedPatientId('');
                setEvolutionTemplateId(null);
              }} 
            />

            {/* Patient Select */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={14} />
                {t('selectPatient')}
              </label>
              <SearchableSelect
                options={patientOptions}
                value={selectedPatientId}
                onChange={id => { setSelectedPatientId(id); setEvolutionTemplateId(null); }}
                placeholder={t('selectPatient')}
              />
            </div>

            {!selectedPatientId ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                <ClipboardList size={48} className="mb-4 text-neutral-200" />
                <p className="text-sm font-medium">{t('selectPatientFirst')}</p>
              </div>
            ) : evolutionTemplateId ? (
              /* Evolution View */
              <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary-600" />
                    {t('evolutionTitle', { name: selectedPatient?.name ?? '' })}
                    {' — '}
                    {templates.find(t => t.id === evolutionTemplateId)?.name}
                  </h3>
                  <button
                    onClick={() => setEvolutionTemplateId(null)}
                    className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Volver
                  </button>
                </div>
                <div className="p-5">
                  {!evolutionData || evolutionData.length === 0 ? (
                    <p className="text-sm text-neutral-400">{t('noResponses')}</p>
                  ) : (
                    <div className="space-y-3">
                      {evolutionData.map((r, i) => (
                        <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                          <span className="text-xs text-neutral-500 font-bold w-6 text-center">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-700">
                              {format(new Date(r.completedAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                          {r.score !== null && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-500">{t('scoreLabel')}:</span>
                              <span className="text-lg font-bold text-primary-700">{r.score}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Responses List */
              loadingResponses ? (
                [1, 2, 3].map(n => (
                  <div key={n} className="h-20 bg-neutral-50 rounded-2xl border border-neutral-100 animate-pulse" />
                ))
              ) : responses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-400 bg-white rounded-2xl border border-neutral-100">
                  <CheckCircle2 size={48} className="mb-4 text-neutral-200" />
                  <p className="text-sm font-medium">{t('noResponses')}</p>
                </div>
              ) : (
                responses.map(response => (
                  <div
                    key={response.id}
                    className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-neutral-200 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 size={16} className="text-success-600 flex-shrink-0" />
                          <h4 className="text-base font-bold text-neutral-900">
                            {response.surveyTemplate?.name ?? 'Cuestionario'}
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-500 ml-6">
                          {t('completedAt')}{' '}
                          {format(new Date(response.completedAt), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                        {response.surveyTemplate?.description && (
                          <p className="text-xs text-neutral-400 mt-1 ml-6 line-clamp-1">
                            {response.surveyTemplate.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {response.score !== null && (
                          <div className="text-center">
                            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">{t('scoreLabel')}</p>
                            <p className="text-2xl font-bold text-primary-700 leading-none mt-0.5">{response.score}</p>
                          </div>
                        )}
                        <button
                          onClick={() => setEvolutionTemplateId(response.surveyTemplate?.id ?? null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition cursor-pointer"
                        >
                          <TrendingUp size={12} />
                          {t('viewEvolution')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      {/* ── Create Template SlideOver ── */}
      <SlideOver
        open={isSlideOverOpen}
        onClose={() => { setSlideOverOpen(false); resetForm(); }}
        title={editingTemplateId ? 'Editar Plantilla' : t('newTemplate')}
      >
        <div className="space-y-5 p-1">
          {/* Template Meta */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                {t('templateName')} *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Ej. PHQ-9 Depresión Mayor"
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                {t('templateDescription')}
              </label>
              <textarea
                value={templateDescription}
                onChange={e => setTemplateDescription(e.target.value)}
                rows={2}
                placeholder="Descripción breve del cuestionario..."
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                {t('templateVersion')}
              </label>
              <input
                type="text"
                value={templateVersion}
                onChange={e => setTemplateVersion(e.target.value)}
                className="w-32 text-sm px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                {t('questions')} ({draftQuestions.length})
              </label>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                <Plus size={14} />
                {t('addQuestion')}
              </button>
            </div>

            <div className="space-y-4">
              {draftQuestions.map((q, idx) => (
                <div key={idx} className="border border-neutral-200 rounded-xl p-4 space-y-3 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase">
                      Pregunta {idx + 1}
                    </span>
                    {draftQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-neutral-400 hover:text-danger-500 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Question text */}
                  <input
                    type="text"
                    value={q.question}
                    onChange={e => updateQuestion(idx, 'question', e.target.value)}
                    placeholder={t('questionText')}
                    className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                  />

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-1">{t('questionType')}</label>
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(idx, 'type', e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                    >
                      {QUESTION_TYPES.map(type => (
                        <option key={type} value={type}>{t(`questionTypes.${type}`)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Options for MULTIPLE_CHOICE */}
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1">{t('options')}</label>
                      <input
                        type="text"
                        value={q.options}
                        onChange={e => updateQuestion(idx, 'options', e.target.value)}
                        placeholder="Opción A, Opción B, Opción C"
                        className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                      />
                    </div>
                  )}

                  {/* Min/Max for LIKERT and NUMERIC_SCALE */}
                  {(q.type === 'LIKERT' || q.type === 'NUMERIC_SCALE') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">{t('minValue')}</label>
                        <input
                          type="number"
                          value={q.minValue}
                          onChange={e => updateQuestion(idx, 'minValue', e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">{t('maxValue')}</label>
                        <input
                          type="number"
                          value={q.maxValue}
                          onChange={e => updateQuestion(idx, 'maxValue', e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Required */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => updateQuestion(idx, 'required', e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs font-semibold text-neutral-600">{t('required')}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleCreateTemplate}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : t('saveTemplate')}
          </button>
        </div>
      </SlideOver>
    </div>
  );
}
