import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  MessageSquare, UserPlus, Check, X, Phone, Video, Send, Search,
  PhoneOff, Mic, MicOff, VideoOff, AlertCircle
} from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { getInitials, getDepartmentConfig } from '@/lib/constants'
import { db } from '@/lib/db'
import type { User, ChatRequest, ChatMessage } from '@/lib/types'

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
    
    // Play calling ringtone
    playRingtone()
    
    setActiveCall({
      status: 'dialing',
      type,
      callerId: currentUser.id,
      calleeId: selectedContact.id
    })

    // Simulate sending network events
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

  // Format call timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Get user details lookup
  const getColleague = (userId: string) => {
    return users.find((u) => u.id === userId)
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-rise">
      {/* 1. Left Sidebar: Contacts and Requests */}
      <div className="w-80 bg-surface/30 backdrop-blur-xl border border-border/10 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
        <h2 className="text-base font-black text-foreground font-outfit uppercase tracking-wider">{i18n.t('chat.contacts')}</h2>
        
        {/* Tab Headers */}
        <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/5">
          {(['active', 'all', 'requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-2 text-micro font-bold rounded-lg transition-all duration-150 active:scale-[0.96] ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
              }`}
            >
              {i18n.t(`chat.tab.${tab}`)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 rtl:left-auto rtl:right-3" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i18n.t('chat.search')}
            className="pl-9 h-9 rounded-xl bg-background/50 border-border/10 hover:border-border/20 rtl:pl-3 rtl:pr-9 text-xs"
          />
        </div>

        {/* Tab Lists */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
          {activeTab === 'active' && (
            activeContacts.length === 0 ? (
              <div className="text-center py-10 text-caption text-muted-foreground">
                {i18n.lang === 'ar' ? 'لا توجد محادثات نشطة بعد' : 'No active chats yet'}
              </div>
            ) : (
              activeContacts
                .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((contact, index) => {
                  const isSelected = selectedContact?.id === contact.id
                  return (
                    <button
                      key={contact.id}
                      style={{ animationDelay: `${index * 40}ms` }}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left rtl:text-right cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-foreground' 
                          : 'border-transparent hover:bg-background/20 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Avatar className="h-9 w-9">
                        {contact.avatar && <AvatarImage src={contact.avatar} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold font-outfit">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{contact.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          @{contact.username} • {contact.department ? i18n.t(getDepartmentConfig(contact.department).label) : ''}
                        </p>
                      </div>
                    </button>
                  )
                })
            )
          )}

          {activeTab === 'all' && (
            filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-caption text-muted-foreground">
                {i18n.lang === 'ar' ? 'لا يوجد موظفون يطابقون البحث' : 'No colleagues match search'}
              </div>
            ) : (
              filteredUsers.map((colleague) => {
                const relation = relations[colleague.id]
                return (
                  <div
                    key={colleague.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/5 bg-background/10 hover:bg-background/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        {colleague.avatar && <AvatarImage src={colleague.avatar} />}
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold font-outfit">
                          {getInitials(colleague.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{colleague.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">@{colleague.username}</p>
                      </div>
                    </div>

                    <div>
                      {!relation ? (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(colleague.id)}
                          className="h-7 rounded-lg text-[10px] font-bold px-3 py-1 cursor-pointer bg-primary hover:bg-primary/95 active:scale-[0.96] transition-transform duration-100 ease-out"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {i18n.t('chat.request.send')}
                        </Button>
                      ) : relation.status === 'pending' ? (
                        <Badge variant="outline" className="text-[9px] px-2 py-0.5 animate-pulse bg-muted/20 border-border/20">
                          {i18n.t('chat.request.pending')}
                        </Badge>
                      ) : relation.status === 'accepted' ? (
                        <Badge variant="success" className="text-[9px] px-2 py-0.5">
                          {i18n.t('chat.request.accepted')}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(colleague.id)}
                          className="h-7 rounded-lg text-[10px] font-bold px-3 py-1 cursor-pointer bg-primary hover:bg-primary/95 active:scale-[0.96] transition-transform duration-100 ease-out"
                        >
                          {i18n.t('chat.request.send')}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )
          )}

          {activeTab === 'requests' && (
            chatRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-center py-10 text-caption text-muted-foreground">
                {i18n.lang === 'ar' ? 'لا توجد طلبات معلقة حالياً' : 'No pending requests'}
              </div>
            ) : (
              chatRequests
                .filter(r => r.status === 'pending')
                .map((req) => {
                  const isReceived = req.receiverId === currentUser?.id
                  const targetUser = getColleague(isReceived ? req.senderId : req.receiverId)
                  if (!targetUser) return null
                  
                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-border/5 bg-background/20 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8">
                          {targetUser.avatar && <AvatarImage src={targetUser.avatar} />}
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold font-outfit">
                            {getInitials(targetUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{targetUser.name}</p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {isReceived ? i18n.t('chat.request.incoming') : i18n.t('chat.request.pending')}
                          </p>
                        </div>
                      </div>

                      {isReceived && (
                        <div className="flex gap-2 w-full mt-1">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 h-7 rounded-lg text-[10px] font-bold bg-success hover:bg-success/95 text-success-foreground active:scale-[0.96] transition-transform duration-100"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {i18n.t('chat.action.accept')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeclineRequest(req.id)}
                            className="flex-1 h-7 rounded-lg text-[10px] font-bold bg-destructive hover:bg-destructive-hover text-destructive-foreground active:scale-[0.96] transition-transform duration-100"
                          >
                            <X className="h-3.5 w-3.5" />
                            {i18n.t('chat.action.decline')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
            )
          )}
        </div>
      </div>

      {/* 2. Main Area: Active Chat dialogue thread */}
      <div className="flex-1 bg-surface/30 backdrop-blur-xl border border-border/10 rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
        {selectedContact ? (
          <>
            {/* Header: user status + Call Controls */}
            <div className="px-6 py-4 border-b border-border/10 bg-background/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {selectedContact.avatar && <AvatarImage src={selectedContact.avatar} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold font-outfit">
                    {getInitials(selectedContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-xs font-black text-foreground">{selectedContact.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedContact.title || (selectedContact.role === 'admin' ? 'System Administrator' : 'Staff')}
                  </span>
                </div>
              </div>

              {/* Call triggers */}
              <div className="flex gap-2">
                <Button
                  onClick={() => initiateCall('voice')}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl h-9 w-9 p-0 bg-background border-border/10 hover:border-border/20 text-foreground hover:bg-primary/5 hover:text-primary cursor-pointer active:scale-[0.95] transition-all duration-150 ease-out"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => initiateCall('video')}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl h-9 w-9 p-0 bg-background border-border/10 hover:border-border/20 text-foreground hover:bg-primary/5 hover:text-primary cursor-pointer active:scale-[0.95] transition-all duration-150 ease-out"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-caption text-muted-foreground p-6 leading-relaxed">
                  {i18n.t('chat.no_messages')}
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.senderId === currentUser?.id
                  return (
                    <div
                      key={msg.id}
                      style={{ animationDelay: `${index * 30}ms` }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-rise`}
                    >
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm shadow-primary/10'
                            : 'bg-muted/40 border border-border/5 text-foreground rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-outfit">{msg.text}</p>
                        <span className="block text-[8px] text-right mt-1 opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString(i18n.lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/10 bg-background/25 flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={i18n.t('chat.placeholder')}
                className="flex-1 h-10 rounded-xl bg-background border-border/10 focus:border-primary/50 text-xs"
              />
              <Button
                type="submit"
                disabled={!messageText.trim()}
                className="h-10 px-4 rounded-xl cursor-pointer bg-primary text-primary-foreground font-bold active:scale-[0.96] transition-transform duration-100 ease-out"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">{i18n.t('chat.action.send')}</span>
              </Button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title={i18n.t('chat.title')}
              description={i18n.t('chat.select_to_start')}
              icon={<MessageSquare className="h-8 w-8 text-primary" />}
            />
          </div>
        )}

        {/* 3. VoIP Calling Screen overlay (DIALING, RINGING, CONNECTED) */}
        {activeCall && activeCall.status !== 'idle' && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl z-40 flex flex-col items-center justify-center p-6 transition-all duration-300">
            
            {/* Caller metadata */}
            <div className="flex flex-col items-center gap-4 text-center mt-auto animate-rise">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-xl">
                  {getColleague(activeCall.status === 'ringing' ? activeCall.callerId : activeCall.calleeId)?.avatar && (
                    <AvatarImage src={getColleague(activeCall.status === 'ringing' ? activeCall.callerId : activeCall.calleeId)?.avatar} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold font-outfit">
                    {getInitials(getColleague(activeCall.status === 'ringing' ? activeCall.callerId : activeCall.calleeId)?.name || 'VOIP')}
                  </AvatarFallback>
                </Avatar>
                
                {/* Dialing/Ringing visual waves */}
                {(activeCall.status === 'dialing' || activeCall.status === 'ringing') && (
                  <span className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-75" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-foreground">
                  {getColleague(activeCall.status === 'ringing' ? activeCall.callerId : activeCall.calleeId)?.name}
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
                    ref={localVideoRef}
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
                    <Check className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => respondToIncomingCall(false)}
                    className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive-hover text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-100 cursor-pointer"
                  >
                    <X className="h-6 w-6" />
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
        )}
      </div>
    </div>
  )
}
