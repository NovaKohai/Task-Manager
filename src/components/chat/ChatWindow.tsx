import React from 'react'
import { Phone, Video, Send, MessageSquare } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { getInitials } from '@/lib/constants'
import type { User, ChatMessage } from '@/lib/types'

function dateLabel(dateStr: string, localeStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return i18n.t('chat.date.today')
  if (date.toDateString() === yesterday.toDateString()) return i18n.t('chat.date.yesterday')
  return date.toLocaleDateString(localeStr, { weekday: 'long', month: 'short', day: 'numeric' })
}

interface ChatWindowProps {
  selectedContact: User | null
  currentUser: User | null
  messages: ChatMessage[]
  messageText: string
  setMessageText: (t: string) => void
  handleSendMessage: (e: React.FormEvent) => void
  initiateCall: (type: 'voice' | 'video') => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedContact,
  currentUser,
  messages,
  messageText,
  setMessageText,
  handleSendMessage,
  initiateCall,
  messagesEndRef,
}) => {
  if (!selectedContact) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          title={i18n.t('chat.title')}
          description={i18n.t('chat.select_to_start')}
          icon={<MessageSquare className="h-8 w-8 text-primary animate-pulse" />}
        />
      </div>
    )
  }

  return (
    <>
      {/* Header: user status + Call Controls with Premium Styling */}
      <div className="px-6 py-4 border-b border-border/10 bg-background/30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
              {selectedContact.avatar && <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />}
              <AvatarFallback className="bg-primary-500 text-primary-foreground text-sm font-bold font-outfit">
                {getInitials(selectedContact.name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
          </div>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-black text-foreground">{selectedContact.name}</span>
            <span className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
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
            className="rounded-xl h-9 w-9 p-0 bg-background/50 border border-border/10 text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 cursor-pointer active:scale-[0.95] transition-all duration-150 ease-out"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => initiateCall('video')}
            variant="secondary"
            size="sm"
            className="rounded-xl h-9 w-9 p-0 bg-background/50 border border-border/10 text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 cursor-pointer active:scale-[0.95] transition-all duration-150 ease-out"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-caption text-muted-foreground/60 p-6 leading-relaxed">
            {i18n.t('chat.no_messages')}
          </div>
        ) : (
          (() => {
            let lastDate = ''
            return messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUser?.id
              const msgDate = msg.createdAt.slice(0, 10)
              const showDateSep = msgDate !== lastDate
              lastDate = msgDate
              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-border/30" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">
                        {dateLabel(msg.createdAt, i18n.localeStr)}
                      </span>
                      <div className="flex-1 h-px bg-border/30" />
                    </div>
                  )}
                  <div
                    style={{ animationDelay: `${index * 30}ms` }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-rise`}
                  >
                    <div
                      className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isOwn
                          ? 'bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white rounded-tr-none shadow-violet-500/10'
                          : 'bg-muted/40 border border-border/10 text-foreground rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-outfit font-medium">{msg.text}</p>
                      
                      <div className={`flex items-center gap-1.5 justify-end mt-1 text-[9px] opacity-75 ${isOwn ? 'text-white/95' : 'text-muted-foreground'}`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString(i18n.localeStr, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                          <span className="text-cyan-200 font-bold tracking-tighter select-none">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input: Floating glassmorphic design */}
      <div className="p-4 bg-background/5 border-t border-border/10">
        <form onSubmit={handleSendMessage} className="flex gap-2 bg-background/60 backdrop-blur-md border border-border/10 p-1.5 rounded-2xl shadow-diffusion items-center">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={i18n.t('chat.placeholder')}
            className="flex-1 h-9 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs px-3 shadow-none focus-visible:border-transparent outline-none focus:outline-none"
          />
          <Button
            type="submit"
            disabled={!messageText.trim()}
            className="h-9 w-9 p-0 rounded-xl cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-bold active:scale-[0.96] transition-transform duration-100 ease-out shrink-0 shadow-md shadow-primary/10"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">{i18n.t('chat.action.send')}</span>
          </Button>
        </form>
      </div>
    </>
  )
}
