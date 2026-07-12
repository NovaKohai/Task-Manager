import React from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/constants'
import type { User } from '@/lib/types'

interface VoipCallOverlayProps {
  activeCall: {
    status: 'idle' | 'dialing' | 'ringing' | 'connected'
    type: 'voice' | 'video'
    callerId: string
    calleeId: string
  } | null
  currentUser: User | null
  getColleague: (id: string) => User | undefined
  callDuration: number
  formatTime: (secs: number) => string
  localVideoRef: React.RefObject<HTMLVideoElement | null>
  isMuted: boolean
  setIsMuted: (m: boolean) => void
  isCamOff: boolean
  setIsCamOff: (c: boolean) => void
  permissionError: boolean
  respondToIncomingCall: (accepted: boolean) => void
  hangupCall: () => void
}

export const VoipCallOverlay: React.FC<VoipCallOverlayProps> = ({
  activeCall,
  currentUser,
  getColleague,
  callDuration,
  formatTime,
  localVideoRef,
  isMuted,
  setIsMuted,
  isCamOff,
  setIsCamOff,
  permissionError,
  respondToIncomingCall,
  hangupCall,
}) => {
  if (!activeCall || activeCall.status === 'idle') return null

  const peerUser = getColleague(activeCall.status === 'ringing' ? activeCall.callerId : activeCall.calleeId)

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl z-40 flex flex-col items-center justify-center p-6 transition-all duration-300">
      
      {/* Caller metadata */}
      <div className="flex flex-col items-center gap-4 text-center mt-auto animate-rise">
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-xl">
            {peerUser?.avatar && (
              <AvatarImage src={peerUser.avatar} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold font-outfit">
              {getInitials(peerUser?.name || 'VOIP')}
            </AvatarFallback>
          </Avatar>
          
          {/* Dialing/Ringing visual waves */}
          {(activeCall.status === 'dialing' || activeCall.status === 'ringing') && (
            <span className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-75" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-black text-foreground">
            {peerUser?.name}
          </h3>
          <p className="text-caption text-muted-foreground mt-1">
            {activeCall.status === 'dialing' && i18n.t('chat.call.calling').replace('{name}', '')}
            {activeCall.status === 'ringing' && i18n.t('chat.call.ringing').replace('{name}', '')}
            {activeCall.status === 'connected' && i18n.t('chat.call.connected')}
          </p>
        </div>

        {/* Connected details */}
        {activeCall.status === 'connected' && (
          <span className="font-mono text-sm bg-primary/10 border border-primary/20 text-primary px-3.5 py-1.5 rounded-full mt-2 font-bold animate-pulse">
            {formatTime(callDuration)}
          </span>
        )}
      </div>

      {/* Video Streams Container (Framer/Emil Layout structure) */}
      {activeCall.status === 'connected' && activeCall.type === 'video' && (
        <div className="my-6 w-full max-w-md h-64 bg-black/40 border border-border/10 rounded-2xl overflow-hidden relative shadow-inner animate-rise">
          
          {/* Actual Camera Feed */}
          {!isCamOff && !permissionError && (
            <video
              ref={localVideoRef as any}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover transform -scale-x-100"
            />
          )}
          
          {/* Fallback Waveform */}
          {(isCamOff || permissionError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface to-background/90 text-center p-6">
              {permissionError ? (
                <>
                  <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
                  <span className="text-[10px] text-muted-foreground leading-normal max-w-[250px]">
                    {i18n.t('chat.call.permission_denied')}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 h-12">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${i * 120}ms` }}
                      className="w-1.5 bg-primary rounded-full animate-bounce h-8"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold font-outfit uppercase">
            {currentUser?.name} ({i18n.t('chat.call.video')})
          </span>
        </div>
      )}

      {/* Voice call wave placeholder */}
      {activeCall.status === 'connected' && activeCall.type === 'voice' && (
        <div className="my-10 flex items-center justify-center gap-1 h-16 animate-rise">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              style={{
                animationDelay: `${i * 80}ms`,
                animationDuration: '0.8s'
              }}
              className={`w-1.5 bg-primary/80 rounded-full animate-bounce h-12 ${isMuted ? 'paused' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Calling action buttons */}
      <div className="mt-auto mb-10 flex items-center gap-6 animate-rise">
        {activeCall.status === 'ringing' ? (
          <>
            <button
              onClick={() => respondToIncomingCall(true)}
              className="h-14 w-14 rounded-full bg-success hover:bg-success/95 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-100 cursor-pointer"
            >
              <Phone className="h-6 w-6" />
            </button>
            <button
              onClick={() => respondToIncomingCall(false)}
              className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive-hover text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-100 cursor-pointer"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </>
        ) : (
          <>
            {activeCall.status === 'connected' && (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`h-11 w-11 rounded-full border border-border/10 flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                    isMuted ? 'bg-amber-500 text-white' : 'bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {activeCall.type === 'video' && (
                  <button
                    onClick={() => setIsCamOff(!isCamOff)}
                    className={`h-11 w-11 rounded-full border border-border/10 flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                      isCamOff ? 'bg-amber-500 text-white' : 'bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    {isCamOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                )}
              </>
            )}

            <button
              onClick={hangupCall}
              className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive-hover text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-100 cursor-pointer"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
