'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface Patient {
  id: string;
  name: string;
  surname: string;
  email?: string;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const t = useTranslations('chat');
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all patients for sidebar
  const { data: patientsResponse, isLoading } = useQuery<{ content: Patient[] }>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get<{ content: Patient[] }>('/v1/patients?size=20');
      return response;
    },
  });

  const patients = patientsResponse?.content || [];

  // Set default selected patient
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, selectedPatient]);

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Get Conversation with selected patient
  const { data: conversation } = useQuery({
    queryKey: ['chat', 'conversation', selectedPatient?.id],
    queryFn: async () => {
      return await api.get<any>(`/v1/chat/conversations/with/${selectedPatient?.id}`);
    },
    enabled: !!selectedPatient?.id,
  });

  // 2. Get Messages for conversation
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat', 'messages', conversation?.id],
    queryFn: async () => {
      return await api.get<any[]>(`/v1/chat/conversations/${conversation?.id}/messages`);
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Basic polling
  });

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await api.post(`/v1/chat/conversations/${conversation?.id}/messages`, { content: text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversation?.id] });
    }
  });

  const activeMessages = messagesData || [];

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation?.id) return;

    sendMessageMutation.mutate(inputText.trim());
    setInputText('');
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6">
      {/* Left Sidebar - Chat List */}
      <div className="w-full md:w-80 bg-white rounded-2xl border border-gray-100 flex flex-col min-h-0 overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-50">
          <h2 className="text-base font-bold text-gray-900">{t('title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-gray-50 rounded-xl animate-pulse m-2" />
            ))
          ) : patients.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">{t('noPatients')}</p>
          ) : (
            patients.map((pat) => {
              const isSelected = selectedPatient?.id === pat.id;
              const initials = `${pat.name?.[0] || ''}${pat.surname?.[0] || ''}`.toUpperCase();

              return (
                <button
                  key={pat.id}
                  onClick={() => setSelectedPatient(pat)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition text-left border ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-100/50'
                      : 'border-transparent hover:bg-gray-50/70'
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {pat.name} {pat.surname}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {t('startConversation')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area - Conversation Box */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between shrink-0 bg-gray-50/20">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {`${selectedPatient.name?.[0] || ''}${selectedPatient.surname?.[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {selectedPatient.name} {selectedPatient.surname}
                  </h3>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-gray-400 font-medium">{t('activePatient')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center text-gray-400">{t('loadingMessages')}</div>
              ) : activeMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col text-center p-6">
                  <p className="text-sm text-gray-400 font-medium">{t('noMessages')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('writeMessageToStart')}</p>
                </div>
              ) : (
                activeMessages.map((msg: any) => {
                  // In CMS, the current user is a professional, so they are not the patient.
                  const isDoc = msg.senderId !== selectedPatient.id;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isDoc ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                          isDoc
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <span
                          className={`block text-[9px] mt-1.5 text-right ${
                            isDoc ? 'text-indigo-200' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-50 flex items-center space-x-3 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('replyTo', { name: selectedPatient.name })}
                className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 font-semibold"
              >
                ➔
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            {t('selectPatient')}
          </div>
        )}
      </div>
    </div>
  );
}
