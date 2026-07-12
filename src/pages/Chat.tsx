import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { db } from '@/lib/db'
import type { User, ChatRequest, ChatMessage } from '@/lib/types'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { VoipCallOverlay } from '@/components/chat/VoipCallOverlay'

// Web Audio API Ringtone Synthesizer
let audioCtx: AudioContext | null = null
let ringInterval: any = null

const playRingtone = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new AudioContextClass()
    ringInterval = setInterval(() => {
      if (!audioCtx) return
      const osc1 = audioCtx.createOscillator()
      const osc2 = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime) // A4
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(480, audioCtx.currentTime) // G4
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9)
      
      osc1.start(audioCtx.currentTime)
      osc1.stop(audioCtx.currentTime + 0.95)
      osc2.start(audioCtx.currentTime)
      osc2.stop(audioCtx.currentTime + 0.95)
    }, 1200)
  } catch (e) {
    console.warn('Failed to start Web Audio Ringtone', e)
  }
}

const stopRingtone = () => {
  if (ringInterval) {
    clearInterval(ringInterval)
    ringInterval = null
  }
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
}

export default function Chat() {
  const currentUser = useAuthStore((s) => s.user)
  const { users, fetchUsers } = useUserStore()
  
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'requests'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const [messageText, setMessageText] = useState('')
  
  // Chat data states loaded dynamically
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  // VoIP call states
  const [activeCall, setActiveCall] = useState<{
    status: 'idle' | 'dialing' | 'ringing' | 'connected'
    type: 'voice' | 'video'
    callerId: string
    calleeId: string
  } | null>(null)
  
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Real-time local state loader
  const loadChatData = useCallback(() => {
    if (!currentUser) return
    setChatRequests(db.getChatRequests(currentUser.id))
    if (selectedContact) {
      setMessages(db.getChatMessages(currentUser.id, selectedContact.id))
    }
  }, [currentUser, selectedContact])

  // Load initial dependencies
  useEffect(() => {
    fetchUsers()
    loadChatData()
  }, [fetchUsers, loadChatData])

  // Real-time synchronization across windows/tabs via custom storage events
  useEffect(() => {
    const handleSync = () => {
      loadChatData()
    }
    window.addEventListener('ttm_realtime_update', handleSync)
    return () => window.removeEventListener('ttm_realtime_update', handleSync)
  }, [loadChatData])

  // Reload messages when switching contacts
  useEffect(() => {
    if (currentUser && selectedContact) {
      setMessages(db.getChatMessages(currentUser.id, selectedContact.id))
      scrollToBottom()
    }
  }, [selectedContact, currentUser])

  // Scroll message thread to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  // VoIP call timer
  useEffect(() => {
    let interval: any = null
    if (activeCall?.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [activeCall?.status])

  // Video call stream activation
  useEffect(() => {
    if (activeCall?.status === 'connected' && activeCall.type === 'video' && !isCamOff) {
      setPermissionError(false)
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setMediaStream(stream)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error('Camera access denied:', err)
          setPermissionError(true)
        })
    } else {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
        setMediaStream(null)
      }
    }
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall?.status, isCamOff])

  // Listen to simulated VoIP calling triggers (custom event simulated locally)
  useEffect(() => {
    const handleSimulatedCall = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && currentUser && customEvent.detail.receiverId === currentUser.id) {
        // Trigger Ringing tone
        playRingtone()
        setActiveCall({
          status: 'ringing',
          type: customEvent.detail.type,
          callerId: customEvent.detail.senderId,
          calleeId: currentUser.id
        })
      }
    }
    window.addEventListener('ttm_simulated_voip_call', handleSimulatedCall)
    return () => window.removeEventListener('ttm_simulated_voip_call', handleSimulatedCall)
  }, [currentUser])

  // Listen to simulated VoIP calling responses
  useEffect(() => {
    const handleCallResponse = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && currentUser && customEvent.detail.callerId === currentUser.id) {
        stopRingtone()
        if (customEvent.detail.accepted) {
          setActiveCall({
            status: 'connected',
            type: customEvent.detail.type,
            callerId: currentUser.id,
            calleeId: customEvent.detail.receiverId
          })
        } else {
          setActiveCall(null)
        }
      }
    }
    window.addEventListener('ttm_simulated_voip_response', handleCallResponse)
    return () => window.removeEventListener('ttm_simulated_voip_response', handleCallResponse)
  }, [currentUser])

  // Listen to simulated VoIP call termination
  useEffect(() => {
    const handleCallEnd = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && currentUser && (customEvent.detail.callerId === currentUser.id || customEvent.detail.receiverId === currentUser.id)) {
        stopRingtone()
        setActiveCall(null)
        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop())
          setMediaStream(null)
        }
      }
    }
    window.addEventListener('ttm_simulated_voip_hangup', handleCallEnd)
    return () => window.removeEventListener('ttm_simulated_voip_hangup', handleCallEnd)
  }, [currentUser, mediaStream])

  // Filtered lists of contacts
  const otherUsers = useMemo(() => {
    if (!currentUser) return []
    return users.filter((u) => u.id !== currentUser.id && u.approved && u.active)
  }, [users, currentUser])

  // Maps of user ID relationships
  const relations = useMemo(() => {
    const map: Record<string, { status: 'pending' | 'accepted' | 'rejected', requestId: string }> = {}
    if (!currentUser) return map
    chatRequests.forEach((req) => {
      const targetId = req.senderId === currentUser.id ? req.receiverId : req.senderId
      map[targetId] = { status: req.status, requestId: req.id }
    })
    return map
  }, [chatRequests, currentUser])

  const activeContacts = useMemo(() => {
    return otherUsers.filter((u) => relations[u.id]?.status === 'accepted')
  }, [otherUsers, relations])

  const filteredUsers = useMemo(() => {
    return otherUsers.filter((u) => {
      const nameMatch = u.name.toLowerCase().includes(searchQuery.toLowerCase())
      const usernameMatch = u.username.toLowerCase().includes(searchQuery.toLowerCase())
      return nameMatch || usernameMatch
    })
  }, [otherUsers, searchQuery])

  // Chat Actions
  const handleSendRequest = (receiverId: string) => {
    if (!currentUser) return
    db.sendChatRequest(currentUser.id, receiverId)
    loadChatData()
  }

  const handleAcceptRequest = (requestId: string) => {
    db.respondToChatRequest(requestId, 'accepted')
    loadChatData()
  }

  const handleDeclineRequest = (requestId: string) => {
    db.respondToChatRequest(requestId, 'rejected')
    loadChatData()
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !selectedContact || !messageText.trim()) return
    db.sendChatMessage(currentUser.id, selectedContact.id, messageText.trim())
    setMessageText('')
    loadChatData()
    scrollToBottom()
  }

  // VoIP call handlers
  const initiateCall = (type: 'voice' | 'video') => {
    if (!currentUser || !selectedContact) return
    
    playRingtone()
    
    setActiveCall({
      status: 'dialing',
      type,
      callerId: currentUser.id,
      calleeId: selectedContact.id
    })

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ttm_simulated_voip_call', {
        detail: { senderId: currentUser.id, receiverId: selectedContact.id, type }
      }))
    }, 100)
  }

  const respondToIncomingCall = (accepted: boolean) => {
    if (!activeCall) return
    stopRingtone()
    
    window.dispatchEvent(new CustomEvent('ttm_simulated_voip_response', {
      detail: { 
        callerId: activeCall.callerId, 
        receiverId: activeCall.calleeId, 
        type: activeCall.type, 
        accepted 
      }
    }))

    if (accepted) {
      setActiveCall({
        ...activeCall,
        status: 'connected'
      })
    } else {
      setActiveCall(null)
    }
  }

  const hangupCall = () => {
    if (!activeCall) return
    stopRingtone()
    
    window.dispatchEvent(new CustomEvent('ttm_simulated_voip_hangup', {
      detail: { callerId: activeCall.callerId, receiverId: activeCall.calleeId }
    }))
    
    setActiveCall(null)
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      setMediaStream(null)
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getColleague = (userId: string) => {
    return users.find((u) => u.id === userId)
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-rise">
      <ChatSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeContacts={activeContacts}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        relations={relations}
        filteredUsers={filteredUsers}
        chatRequests={chatRequests}
        currentUser={currentUser}
        getColleague={getColleague}
        handleSendRequest={handleSendRequest}
        handleAcceptRequest={handleAcceptRequest}
        handleDeclineRequest={handleDeclineRequest}
      />

      <div className="flex-1 bg-surface/30 backdrop-blur-xl border border-border/10 rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
        <ChatWindow
          selectedContact={selectedContact}
          currentUser={currentUser}
          messages={messages}
          messageText={messageText}
          setMessageText={setMessageText}
          handleSendMessage={handleSendMessage}
          initiateCall={initiateCall}
          messagesEndRef={messagesEndRef}
        />

        <VoipCallOverlay
          activeCall={activeCall}
          currentUser={currentUser}
          getColleague={getColleague}
          callDuration={callDuration}
          formatTime={formatTime}
          localVideoRef={localVideoRef}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isCamOff={isCamOff}
          setIsCamOff={setIsCamOff}
          permissionError={permissionError}
          respondToIncomingCall={respondToIncomingCall}
          hangupCall={hangupCall}
        />
      </div>
    </div>
  )
}
