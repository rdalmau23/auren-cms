'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

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

const PRESET_MOCK_CONVERSATIONS: Record<string, ChatMessage[]> = {
  // Pre-seed conversation for Carlos López
  'carlos': [
    { id: '1', sender: 'patient', content: 'Hola doctor, he estado sintiendo un poco más de ansiedad por las mañanas.', timestamp: new Date(Date.now() - 3600000 * 4) },
    { id: '2', sender: 'doctor', content: 'Hola Carlos. ¿Has estado tomando la Sertralina con el desayuno como indicamos?', timestamp: new Date(Date.now() - 3600000 * 3) },
    { id: '3', sender: 'patient', content: 'Sí, todos los días. Aunque a veces me da un poco de náuseas al principio.', timestamp: new Date(Date.now() - 3600000 * 2) },
    { id: '4', sender: 'doctor', content: 'Es normal durante las primeras semanas. Intenta tomarla con un vaso grande de agua.', timestamp: new Date(Date.now() - 3600000 * 1) },
  ],
  // Pre-seed conversation for Ana García
  'ana': [
    { id: '1', sender: 'patient', content: 'Doctor, una duda rápida, ¿puedo tomar Lorazepam si tengo una reunión importante mañana por la mañana?', timestamp: new Date(Date.now() - 3600000 * 24) },
    { id: '2', sender: 'doctor', content: 'Hola Ana. El Lorazepam puede causarte algo de somnolencia residual. Si la reunión es temprano, tómalo al menos 8 horas antes.', timestamp: new Date(Date.now() - 3600000 * 23) },
    { id: '3', sender: 'patient', content: 'Entendido, me lo tomaré temprano hoy. ¡Gracias!', timestamp: new Date(Date.now() - 3600000 * 22) },
  ],
};

const SIMULATED_RESPONSES = [
  'Perfecto, muchas gracias por la aclaración.',
  'De acuerdo, seguiré sus indicaciones y nos vemos en la próxima consulta.',
  'Vale, lo tendré en cuenta. Por cierto, hoy me he sentido bastante mejor.',
  'Entendido doctor. Muchas gracias por responder tan rápido.',
  '¿Hay algún problema si cambio la hora de la toma a la noche?',
];

export default function ChatPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(PRESET_MOCK_CONVERSATIONS);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all patients
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

  useEffect(() => {
    scrollToBottom();
  }, [selectedPatient, conversations, isTyping]);

  const getChatKey = (patient: Patient) => {
    const nameLower = patient.name?.toLowerCase() || '';
    if (nameLower.includes('carlos')) return 'carlos';
    if (nameLower.includes('ana')) return 'ana';
    return patient.id;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPatient) return;

    const chatKey = getChatKey(selectedPatient);
    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: 'doctor',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Update conversation state
    setConversations((prev) => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), userMessage],
    }));
    setInputText('');

    // Trigger typing indicator and reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMessage: ChatMessage = {
        id: Math.random().toString(),
        sender: 'patient',
        content: SIMULATED_RESPONSES[Math.floor(Math.random() * SIMULATED_RESPONSES.length)],
        timestamp: new Date(),
      };
      setConversations((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), replyMessage],
      }));
    }, 2000);
  };

  const activeMessages = selectedPatient ? conversations[getChatKey(selectedPatient)] || [] : [];

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6">
      {/* Left Sidebar - Chat List */}
      <div className="w-full md:w-80 bg-white rounded-2xl border border-gray-100 flex flex-col min-h-0 overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-50">
          <h2 className="text-base font-bold text-gray-900">Mensajería Clínica</h2>
          <p className="text-xs text-gray-400 mt-0.5">Soporte y seguimiento de pacientes</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-gray-50 rounded-xl animate-pulse m-2" />
            ))
          ) : patients.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No hay pacientes registrados</p>
          ) : (
            patients.map((pat) => {
              const isSelected = selectedPatient?.id === pat.id;
              const lastMsg = conversations[getChatKey(pat)]?.slice(-1)[0];
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
                      {lastMsg ? lastMsg.content : 'Inicia una conversación...'}
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
                    <span className="text-[10px] text-gray-400 font-medium">Paciente activo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {activeMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col text-center p-6">
                  <p className="text-sm text-gray-400 font-medium">No hay mensajes previos.</p>
                  <p className="text-xs text-gray-400 mt-1">Escribe un mensaje abajo para comenzar el seguimiento clínico.</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isDoc = msg.sender === 'doctor';
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
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-50 flex items-center space-x-3 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Responder a ${selectedPatient.name}...`}
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
            Selecciona un paciente a la izquierda para ver su chat.
          </div>
        )}
      </div>
    </div>
  );
}
