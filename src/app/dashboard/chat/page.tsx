'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Client } from '@stomp/stompjs';
import { Video } from 'lucide-react';
import { VideoRoomOverlay } from '../../../components/chat/VideoRoomOverlay';
import { EventTracker } from '@/lib/analytics';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface Patient {
  id: string;
  userId: string;
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
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [inputText, setInputText] = useState('');
  const [activeRoomUrl, setActiveRoomUrl] = useState<string | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // STOMP Client ref
  const stompClientRef = useRef<Client | null>(null);

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

  // 1. Get Conversation  // Fetch or create conversation
  const { data: conversationData } = useQuery({
    queryKey: ['chat', 'conversation', selectedPatient?.userId],
    queryFn: async () => {
      return await api.get<any>(`/v1/chat/conversations/with/${selectedPatient?.userId}`);
    },
    enabled: !!selectedPatient?.userId,
  });

  const conversation = conversationData;

  // 2. Get Messages for conversation (Polling removed)
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat', 'messages', conversation?.id],
    queryFn: async () => {
      return await api.get<any[]>(`/v1/chat/conversations/${conversation?.id}/messages`);
    },
    enabled: !!conversation?.id,
  });

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await api.post(`/v1/chat/conversations/${conversation?.id}/messages`, { content: text });
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['chat', 'messages', conversation?.id], (old: any[]) => {
        return [...(old || []), newMessage];
      });
    }
  });

  // STOMP WebSocket Connection
  useEffect(() => {
    const token = (session as any)?.accessToken;
    const userId = (session as any)?.user?.id;
    if (!token || !userId) return;

    const wsUrl = typeof window !== 'undefined'
      ? `ws://${window.location.host}/ws`
      : (process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws').replace('/api', '/ws') || 'ws://localhost:8080/ws');

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log('[STOMP] ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function (frame) {
      console.log('[STOMP] Connected: ' + frame);
      
      // Subscribe to user queue for new messages
      client.subscribe('/user/queue/messages', (messageFrame) => {
        if (messageFrame.body) {
          const newMessage = JSON.parse(messageFrame.body);
          console.log('[STOMP] New message received:', newMessage);
          
          // Update the cache directly for the relevant conversation
          queryClient.setQueryData(['chat', 'messages', newMessage.conversationId], (old: any[]) => {
            // Avoid duplicates
            if (old && old.find(m => m.id === newMessage.id)) return old;
            return [...(old || []), newMessage];
          });
        }
      });
    };

    client.onStompError = function (frame) {
      console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
      console.error('[STOMP] Additional details: ' + frame.body);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [session, queryClient]);

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

  const handleStartCall = async () => {
    if (!conversation?.id || isStartingCall) return;
    try {
      setIsStartingCall(true);
      
      // 1. Ask Backend to generate a Daily.co Room URL
      const response = await api.post<{roomUrl: string, roomName: string, professionalToken: string, patientToken: string}>(`/v1/chat/conversations/${conversation.id}/video-room`, {});
      
      // Track video call started
      EventTracker.track({
        name: 'VideoCall_Started',
        properties: { patientId: selectedPatient?.userId || '' }
      });

      // 2. Open the UI overlay with the room URL (append the professional token)
      setActiveRoomUrl(`${response.roomUrl}?t=${response.professionalToken}`);
      
      // 3. Send a chat message with the link so the patient can join from mobile
      sendMessageMutation.mutate(`[SISTEMA] El Doctor ha iniciado una consulta telemática. Únete desde este enlace seguro: ${response.roomUrl}?t=${response.patientToken}`);
      
    } catch (error) {
      console.error('Error starting video call', error);
    } finally {
      setIsStartingCall(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* Left Sidebar - Chat List */}
      <div className="w-full md:w-80 bg-white rounded-2xl border border-neutral-100 flex flex-col min-h-0 overflow-hidden shrink-0">
        <div className="p-4 border-b border-neutral-50">
          <h2 className="text-base font-bold text-neutral-900">{t('title')}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-50 p-2 space-y-1">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-neutral-50 rounded-xl animate-pulse m-2" />
            ))
          ) : patients.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-6">{t('noPatients')}</p>
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
                      ? 'bg-primary-50 border-primary-100'
                      : 'border-transparent hover:bg-neutral-50'
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">
                        {pat.name} {pat.surname}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
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
      <div className="flex-1 bg-white rounded-2xl border border-neutral-100 flex flex-col min-h-0 overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-neutral-50 flex items-center justify-between shrink-0 bg-neutral-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {`${selectedPatient.name?.[0] || ''}${selectedPatient.surname?.[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {selectedPatient.name} {selectedPatient.surname}
                  </h3>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
                    <span className="text-[10px] text-neutral-400 font-medium">{t('activePatient')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleStartCall}
                disabled={isStartingCall || !conversation?.id}
                className="h-10 px-4 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 font-semibold text-sm border border-primary-200"
              >
                <Video size={18} />
                {isStartingCall ? 'Iniciando...' : 'Videollamada'}
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/30">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center text-neutral-400">{t('loadingMessages')}</div>
              ) : activeMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col text-center p-6">
                  <p className="text-sm text-neutral-400 font-medium">{t('noMessages')}</p>
                  <p className="text-xs text-neutral-400 mt-1">{t('writeMessageToStart')}</p>
                </div>
              ) : (
                activeMessages.map((msg: any) => {
                  // In CMS, the current user is a professional, so they are not the patient.
                  const isDoc = msg.senderId !== selectedPatient.userId;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isDoc ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                          isDoc
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-white text-neutral-800 border border-neutral-100 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span
                          className={`block text-[9px] mt-1.5 text-right ${
                            isDoc ? 'text-primary-200' : 'text-neutral-400'
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-50 flex items-center space-x-3 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('replyTo', { name: selectedPatient.name })}
                className="flex-1 text-sm px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-10 w-10 bg-primary-600 hover:bg-primary-500 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 font-semibold"
              >
                ➔
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
            {t('selectPatient')}
          </div>
        )}
      </div>

      {activeRoomUrl && (
        <VideoRoomOverlay roomUrl={activeRoomUrl} onLeave={() => setActiveRoomUrl(null)} />
      )}
    </div>
  );
}
