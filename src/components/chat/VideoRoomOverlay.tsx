import React, { useCallback, useState } from 'react';
import {
  DailyProvider,
  useDaily,
  useLocalSessionId,
  useParticipantIds,
  useVideoTrack,
  useAudioTrack,
  useDailyEvent
} from '@daily-co/daily-react';
import { VideoOff, MicOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import DailyIframe from '@daily-co/daily-js';

// Tile Component
function VideoTile({ id, isLocal }: { id: string; isLocal?: boolean }) {
  const videoState = useVideoTrack(id);
  const audioState = useAudioTrack(id);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (videoRef.current && videoState.persistentTrack) {
      videoRef.current.srcObject = new MediaStream([videoState.persistentTrack]);
    }
  }, [videoState.persistentTrack]);

  React.useEffect(() => {
    if (audioRef.current && audioState.persistentTrack && !isLocal) {
      audioRef.current.srcObject = new MediaStream([audioState.persistentTrack]);
    }
  }, [audioState.persistentTrack, isLocal]);

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-lg ${isLocal ? 'w-48 h-32 absolute bottom-4 right-4 border-2 border-white/20 shadow-xl z-20' : 'w-full h-full'}`}>
      <video
        autoPlay
        muted
        playsInline
        ref={videoRef}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      {!isLocal && (
        <audio autoPlay playsInline ref={audioRef} />
      )}
      
      {videoState.state !== 'playable' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <VideoOff size={32} className="text-gray-500" />
        </div>
      )}
    </div>
  );
}

// Call Interface
function CallUI({ onLeave }: { onLeave: () => void }) {
  const localSessionId = useLocalSessionId();
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
  const [isMinimized, setIsMinimized] = useState(false);
  const callObject = useDaily();

  useDailyEvent('left-meeting', useCallback(() => {
    onLeave();
  }, [onLeave]));

  const leaveCall = useCallback(() => {
    callObject?.leave();
    onLeave();
  }, [callObject, onLeave]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 w-64 h-36 bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col group transition-all cursor-pointer" onClick={() => setIsMinimized(false)}>
        {remoteParticipantIds.length > 0 ? (
          <VideoTile id={remoteParticipantIds[0]} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white text-sm">Esperando paciente...</div>
        )}
        <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={16} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-4xl aspect-video bg-gray-900 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Header Overlay */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-medium text-sm drop-shadow-md">Consulta Telemática Auren</span>
          </div>
          <button onClick={() => setIsMinimized(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md">
            <Minimize2 size={18} className="text-white" />
          </button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 relative bg-gray-900">
          {remoteParticipantIds.length > 0 ? (
            <VideoTile id={remoteParticipantIds[0]} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-medium">Esperando a que el paciente se una...</p>
            </div>
          )}

          {localSessionId && (
            <VideoTile id={localSessionId} isLocal />
          )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-30 flex justify-center items-center gap-4">
          <button onClick={leaveCall} className="h-14 w-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <PhoneOff size={24} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Export
export function VideoRoomOverlay({ roomUrl, onLeave }: { roomUrl: string, onLeave: () => void }) {
  const [callObject, setCallObject] = useState<any>(null);

  React.useEffect(() => {
    if (!roomUrl) return;
    
    // Create the Daily call object
    const newCallObject = DailyIframe.createCallObject();
    
    // Join the room
    newCallObject.join({ url: roomUrl }).then(() => {
      console.log('Joined room:', roomUrl);
    }).catch(err => {
      console.error('Error joining room', err);
    });
    
    setCallObject(newCallObject);

    return () => {
      newCallObject.destroy();
    };
  }, [roomUrl]);

  if (!callObject) return null;

  return (
    <DailyProvider callObject={callObject}>
      <CallUI onLeave={onLeave} />
    </DailyProvider>
  );
}
